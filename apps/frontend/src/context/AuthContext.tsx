import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'
import { fetchWithTimeout } from '../utils/api'

export type AuthStatus = 'booting' | 'authing' | 'ready' | 'error'

export type BootPhase = 'start' | 'tg_ready' | 'tg_data_ok' | 'auth_request' | 'auth_ok' | 'boot_done' | 'error'

export type AuthState = {
  status: AuthStatus
  displayName: string | null // For greeting (from initDataUnsafe)
  error: string | null // Specific error message
  token: string | null
  phase: BootPhase | null
  requestId: string | null
  retry: () => void
}

const AuthContext = createContext<AuthState>({
  status: 'booting',
  displayName: null,
  error: null,
  token: null,
  phase: null,
  requestId: null,
  retry: () => {},
})

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    status: 'booting',
    displayName: null,
    error: null,
    token: null,
    phase: null,
    requestId: null,
    retry: () => {},
  })

  const performBootstrap = useCallback(async () => {
    // Reset state on retry
    setState({
      status: 'booting',
      displayName: null,
      error: null,
      token: null,
      phase: 'start',
      requestId: null,
      retry: performBootstrap,
    })
    
    const requestId = Date.now().toString()
    let currentPhase: BootPhase = 'start'
    
    const setPhase = (phase: BootPhase) => {
      currentPhase = phase
      setState(prev => ({ ...prev, phase }))
      console.log(`[ASKED BOOT] phase: ${phase}`)
    }

    try {
      setPhase('start')
      
      // BOOT: Get Telegram WebApp
      const tg = window.Telegram?.WebApp
      const hasWebApp = !!tg
      
      console.log('[ASKED BOOT] hasWebApp', hasWebApp)
      console.log('[ASKED BOOT] href', window.location.href)
      
      // Initialize WebApp if available
      if (tg) {
        tg.ready?.()
        tg.expand?.()
        setPhase('tg_ready')
      } else {
        setPhase('error')
        setState(prev => ({
          ...prev,
          status: 'error',
          error: 'Telegram WebApp не найден',
          requestId,
          retry: performBootstrap,
        }))
        return
      }

      // Get initData and unsafeUser
      const initData = tg?.initData || ''
      const unsafeUser = tg?.initDataUnsafe?.user || null
      
      // Safe initData preview (first 20 chars)
      const initDataPreview = initData.length > 0 
        ? `${initData.substring(0, 20)}...` 
        : '(empty)'
      
      console.log('[ASKED BOOT] initDataLen', initData.length)
      console.log('[ASKED BOOT] initDataPreview', initDataPreview)
      console.log('[ASKED BOOT] tg.initDataUnsafe.user?.id', unsafeUser?.id)
      
      // Set display name for greeting (from unsafeUser)
      if (unsafeUser) {
        const displayName = unsafeUser.first_name || unsafeUser.username || null
        setState(prev => ({ ...prev, displayName }))
      }

      if (initData.length > 0 && unsafeUser) {
        setPhase('tg_data_ok')
      } else if (initData.length === 0 && unsafeUser) {
        // We have user but no initData - can't authenticate
        setPhase('error')
        setState(prev => ({
          ...prev,
          status: 'error',
          error: 'Не удалось получить данные Telegram. Перезапусти через /start.',
          requestId,
          retry: performBootstrap,
        }))
        return
      }

      // Get backend URL - check VITE_BACKEND_URL first
      const envBackendUrl = (import.meta as any).env?.VITE_BACKEND_URL || 
                            (import.meta as any).env?.VITE_API_URL || 
                            (import.meta as any).env?.VITE_API_BASE
      
      if (!envBackendUrl) {
        const errorMsg = 'Не настроен VITE_API_URL'
        console.warn('[ASKED BOOT]', errorMsg)
        setPhase('error')
        setState({
          status: 'error',
          displayName: unsafeUser ? (unsafeUser.first_name || unsafeUser.username || null) : null,
          error: errorMsg,
          token: null,
          phase: 'error',
          requestId,
          retry: performBootstrap,
        })
        return
      }

      // Normalize backend URL
      let backendUrl = envBackendUrl.trim()
      if (backendUrl.includes(' ')) {
        console.warn('[ASKED BOOT] Backend URL contains spaces, trimming')
        backendUrl = backendUrl.replace(/\s+/g, '')
      }
      if (!backendUrl.startsWith('https://') && !backendUrl.startsWith('http://')) {
        console.warn('[ASKED BOOT] Backend URL does not start with http:// or https://, adding https://')
        backendUrl = `https://${backendUrl}`
      }
      if (backendUrl.endsWith('/')) {
        backendUrl = backendUrl.slice(0, -1)
      }
      
      console.log('[ASKED BOOT] backendUrl', backendUrl)

      // Check if we have a stored token
      const storedToken = localStorage.getItem('asked_telegram_token')
      if (storedToken) {
        // TODO: Validate token with backend (optional)
        // For now, proceed to auth
      }

      // If initData is available, try to authenticate
      if (initData.length > 0) {
        setState(prev => ({ ...prev, status: 'authing' }))
        setPhase('auth_request')
        
        const authUrl = `${backendUrl}/api/auth/telegram`
        
        console.log('[ASKED BOOT] auth_request', authUrl)
        
        try {
          const response = await fetchWithTimeout(authUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ initData }),
          }, 15000)

          const responseText = await response.text()
          
          console.log('[ASKED BOOT] auth_response status', response.status)
          console.log('[ASKED BOOT] auth_response text', responseText.substring(0, 200))

          if (!response.ok) {
            // Parse error message if possible
            let errorMessage = `Auth failed: ${response.status}`
            try {
              const errorData = JSON.parse(responseText)
              if (errorData.error) {
                errorMessage = `Auth failed: ${response.status} ${errorData.error}`
              } else {
                errorMessage = `Auth failed: ${response.status} ${responseText.substring(0, 100)}`
              }
            } catch {
              errorMessage = `Auth failed: ${response.status} ${responseText.substring(0, 100) || 'Unknown error'}`
            }
            
            setPhase('error')
            setState(prev => ({
              ...prev,
              status: 'error',
              error: errorMessage,
              requestId,
              retry: performBootstrap,
            }))
            return
          }

          // Parse response and store token
          try {
            const data = JSON.parse(responseText)
            if (data.token) {
              localStorage.setItem('asked_telegram_token', data.token)
              setPhase('auth_ok')
              setState(prev => ({
                ...prev,
                status: 'ready',
                token: data.token,
                error: null,
                phase: 'boot_done',
              }))
            } else {
              setPhase('error')
              setState(prev => ({
                ...prev,
                status: 'error',
                error: 'Auth failed: No token in response',
                requestId,
                retry: performBootstrap,
              }))
            }
          } catch (parseError) {
            setPhase('error')
            setState(prev => ({
              ...prev,
              status: 'error',
              error: `Auth failed: Invalid response format`,
              requestId,
              retry: performBootstrap,
            }))
          }
        } catch (fetchError) {
          let errorMsg = 'Auth failed: Network error'
          if (fetchError instanceof Error) {
            if (fetchError.message.includes('timeout')) {
              errorMsg = 'Бэкенд не отвечает (timeout)'
            } else {
              errorMsg = `Auth failed: ${fetchError.message}`
            }
          }
          console.error('[ASKED BOOT] fetch error:', fetchError)
          setPhase('error')
          setState(prev => ({
            ...prev,
            status: 'error',
            error: errorMsg,
            requestId,
            retry: performBootstrap,
          }))
        }
      } else {
        // No initData - can't authenticate
        setPhase('error')
        if (!unsafeUser) {
          setState(prev => ({
            ...prev,
            status: 'error',
            error: 'Не удалось получить данные Telegram. Перезапусти через /start.',
            requestId,
          }))
        } else {
          // We have unsafeUser but no initData - show greeting but mark as error
          setState(prev => ({
            ...prev,
            status: 'error',
            error: 'Не удалось получить данные Telegram. Перезапусти через /start.',
            requestId,
          }))
        }
      }
    } catch (error) {
      console.error('[ASKED BOOT] Error:', error)
      setPhase('error')
      setState(prev => ({
        ...prev,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        requestId,
        retry: performBootstrap,
      }))
    } finally {
      // Guarantee loading is false
      console.log('[ASKED BOOT] finally - phase:', currentPhase)
    }
  }, [])

  useEffect(() => {
    performBootstrap()
  }, [performBootstrap])

  // Update state with retry function
  useEffect(() => {
    setState(prev => ({ ...prev, retry: performBootstrap }))
  }, [performBootstrap])

  return (
    <AuthContext.Provider value={state}>
      {children}
    </AuthContext.Provider>
  )
}
      try {
        // BOOT: Get Telegram WebApp
        const tg = window.Telegram?.WebApp
        const hasWebApp = !!tg
        
        console.log('[BOOT] hasWebApp', hasWebApp)
        console.log('[BOOT] href', window.location.href)
        
        // Initialize WebApp if available
        if (tg) {
          tg.ready?.()
          tg.expand?.()
        }

        // Get initData and unsafeUser
        const initData = tg?.initData || ''
        const unsafeUser = tg?.initDataUnsafe?.user || null
        
        console.log('[BOOT] initDataLen', initData.length)
        
        // Set display name for greeting (from unsafeUser)
        if (unsafeUser) {
          const displayName = unsafeUser.first_name || unsafeUser.username || null
          setState(prev => ({ ...prev, displayName }))
        }

        // Get backend URL - check VITE_BACKEND_URL first
        const envBackendUrl = (import.meta as any).env?.VITE_BACKEND_URL || 
                              (import.meta as any).env?.VITE_API_URL || 
                              (import.meta as any).env?.VITE_API_BASE
        
        if (!envBackendUrl) {
          const errorMsg = 'VITE_BACKEND_URL is missing'
          console.error('[BOOT]', errorMsg)
          setState({
            status: 'error',
            displayName: unsafeUser ? (unsafeUser.first_name || unsafeUser.username || null) : null,
            error: errorMsg,
            token: null,
          })
          return
        }

        const backendUrl = envBackendUrl.endsWith('/') 
          ? envBackendUrl.slice(0, -1)
          : envBackendUrl
        
        console.log('[BOOT] backendUrl', backendUrl)

        // Check if we have a stored token
        const storedToken = localStorage.getItem('asked_telegram_token')
        if (storedToken) {
          // TODO: Validate token with backend (optional)
          // For now, proceed to auth
        }

        // If initData is available, try to authenticate
        if (initData.length > 0) {
          setState(prev => ({ ...prev, status: 'authing' }))
          
          const authUrl = `${backendUrl}/api/auth/telegram`
          
          console.log('[AUTH] request', authUrl)
          
          try {
            const response = await fetch(authUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ initData }),
            })

            const responseText = await response.text()
            
            console.log('[AUTH] status', response.status)
            console.log('[AUTH] responseText', responseText)

            if (!response.ok) {
              // Parse error message if possible
              let errorMessage = `Auth failed: ${response.status}`
              try {
                const errorData = JSON.parse(responseText)
                if (errorData.error) {
                  errorMessage = `Auth failed: ${response.status} ${errorData.error}`
                } else {
                  errorMessage = `Auth failed: ${response.status} ${responseText}`
                }
              } catch {
                errorMessage = `Auth failed: ${response.status} ${responseText || 'Unknown error'}`
              }
              
              setState(prev => ({
                ...prev,
                status: 'error',
                error: errorMessage,
              }))
              return
            }

            // Parse response and store token
            try {
              const data = JSON.parse(responseText)
              if (data.token) {
                localStorage.setItem('asked_telegram_token', data.token)
                setState(prev => ({
                  ...prev,
                  status: 'ready',
                  token: data.token,
                  error: null,
                }))
              } else {
                setState(prev => ({
                  ...prev,
                  status: 'error',
                  error: 'Auth failed: No token in response',
                }))
              }
            } catch (parseError) {
              setState(prev => ({
                ...prev,
                status: 'error',
                error: `Auth failed: Invalid response format`,
              }))
            }
          } catch (fetchError) {
            const errorMsg = fetchError instanceof Error 
              ? `Auth failed: ${fetchError.message}`
              : 'Auth failed: Network error'
            console.error('[AUTH] Error:', fetchError)
            setState(prev => ({
              ...prev,
              status: 'error',
              error: errorMsg,
            }))
          }
        } else {
          // No initData - can't authenticate, but don't show error if we have unsafeUser (for greeting)
          if (!unsafeUser) {
            setState(prev => ({
              ...prev,
              status: 'error',
              error: 'Не удалось получить данные Telegram. Перезапусти через /start.',
            }))
          } else {
            // We have unsafeUser but no initData - show greeting but mark as error
            setState(prev => ({
              ...prev,
              status: 'error',
              error: 'Не удалось получить данные Telegram. Перезапусти через /start.',
            }))
          }
        }
      } catch (error) {
        console.error('[BOOT] Error:', error)
        setState(prev => ({
          ...prev,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
        }))
      }
    }

    performBootstrap()
  }, [])

  return (
    <AuthContext.Provider value={state}>
      {children}
    </AuthContext.Provider>
  )
}

