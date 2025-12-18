import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export type AuthStatus = 'booting' | 'authing' | 'ready' | 'error'

export type AuthState = {
  status: AuthStatus
  displayName: string | null // For greeting (from initDataUnsafe)
  error: string | null // Specific error message
  token: string | null
}

const AuthContext = createContext<AuthState>({
  status: 'booting',
  displayName: null,
  error: null,
  token: null,
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
  })

  useEffect(() => {
    const performBootstrap = async () => {
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

