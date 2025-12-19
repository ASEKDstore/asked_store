import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'
import { fetchWithTimeout } from '../utils/api'

export type AuthStatus = 'booting' | 'authing' | 'ready' | 'error'

export type BootPhase = 'start' | 'tg_ready' | 'tg_data_ok' | 'auth_request' | 'auth_ok' | 'boot_done' | 'error'

export type AuthState = {
  status: AuthStatus
  displayName: string | null // For greeting (from initDataUnsafe)
  error: string | null // Specific error message
  errorStatus: number | null // HTTP status code if available
  errorDetails: string | null // Additional error details (response text)
  token: string | null
  role: 'admin' | 'user' | null // User role from backend
  phase: BootPhase | null
  requestId: string | null
  retry: () => void
}

const AuthContext = createContext<AuthState>({
  status: 'booting',
  displayName: null,
  error: null,
  errorStatus: null,
  errorDetails: null,
  token: null,
  role: null,
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
    errorStatus: null,
    errorDetails: null,
    token: null,
    role: null,
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
      errorStatus: null,
      errorDetails: null,
      token: null,
      role: null,
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
          errorStatus: null,
          errorDetails: null,
          role: null,
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
          errorStatus: null,
          errorDetails: null,
          role: null,
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
          errorStatus: null,
          errorDetails: null,
          token: null,
          role: null,
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
            // Parse error message if possible - ensure it's always a string
            let errorMessage = 'Ошибка авторизации'
            let errorDetails: string | null = null
            
            try {
              const errorData = JSON.parse(responseText)
              if (errorData && typeof errorData.error === 'string') {
                errorMessage = errorData.error
                errorDetails = responseText.substring(0, 200) // Store full response for details
              } else if (errorData && typeof errorData === 'object') {
                // If error is an object, stringify it safely
                errorMessage = JSON.stringify(errorData).substring(0, 100)
                errorDetails = responseText.substring(0, 200)
              } else {
                errorMessage = String(responseText).substring(0, 100) || 'Unknown error'
                errorDetails = responseText.substring(0, 200)
              }
            } catch {
              // If parsing fails, use responseText as string
              errorMessage = String(responseText).substring(0, 100) || 'Unknown error'
              errorDetails = responseText.substring(0, 200)
            }
            
            // Ensure errorMessage is always a string
            const safeErrorMessage = String(errorMessage)
            const safeErrorDetails = errorDetails ? String(errorDetails) : null
            
            setPhase('error')
            setState(prev => ({
              ...prev,
              status: 'error',
              error: safeErrorMessage,
              errorStatus: response.status,
              errorDetails: safeErrorDetails,
              role: null,
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
                role: role,
                error: null,
                phase: 'boot_done',
              }))
            } else {
              setPhase('error')
              setState(prev => ({
                ...prev,
                status: 'error',
                error: 'Auth failed: No token in response',
                errorStatus: null,
                errorDetails: null,
                role: null,
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
              errorStatus: null,
              errorDetails: null,
              role: null,
              requestId,
              retry: performBootstrap,
            }))
          }
        } catch (fetchError) {
          // Ensure error message is always a string
          let errorMsg = 'Auth failed: Network error'
          if (fetchError instanceof Error) {
            if (fetchError.message.includes('timeout')) {
              errorMsg = 'Бэкенд не отвечает (timeout)'
            } else {
              errorMsg = `Auth failed: ${String(fetchError.message)}`
            }
          } else {
            errorMsg = `Auth failed: ${String(fetchError)}`
          }
          console.error('[ASKED BOOT] fetch error:', fetchError)
          setPhase('error')
          setState(prev => ({
            ...prev,
            status: 'error',
            error: String(errorMsg), // Ensure it's a string
            errorStatus: null,
            errorDetails: null,
            role: null,
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
            errorStatus: null,
            errorDetails: null,
            role: null,
            requestId,
            retry: performBootstrap,
          }))
        } else {
          // We have unsafeUser but no initData - show greeting but mark as error
          setState(prev => ({
            ...prev,
            status: 'error',
            error: 'Не удалось получить данные Telegram. Перезапусти через /start.',
            errorStatus: null,
            errorDetails: null,
            role: null,
            requestId,
            retry: performBootstrap,
          }))
        }
      }
    } catch (error) {
      console.error('[ASKED BOOT] Error:', error)
      setPhase('error')
      // Ensure error message is always a string
      const errorMessage = error instanceof Error 
        ? String(error.message) 
        : String(error || 'Unknown error')
      setState(prev => ({
        ...prev,
        status: 'error',
        error: errorMessage,
        errorStatus: null,
        errorDetails: null,
        role: null,
        requestId,
        retry: performBootstrap,
      }))
    } finally {
      // Guarantee loading is false - ensure status is set
      console.log('[ASKED BOOT] finally - phase:', currentPhase)
      // State is already set in catch/error blocks, no need to check here
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

