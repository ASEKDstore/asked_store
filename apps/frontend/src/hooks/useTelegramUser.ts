import { useEffect } from 'react'
import { initTelegramWebApp, getTelegramWebApp } from '../lib/telegram'
import { useUser } from '../context/UserContext'
import { apiUrl } from '../utils/api'

/**
 * Hook to initialize Telegram WebApp and sync user data
 * - Calls tg.ready() and tg.expand() if available
 * - Reads Telegram user data and saves to UserContext via setTelegramUser
 * - Tries to authenticate with backend if initData is available (non-blocking)
 * - Works in guest mode if Telegram is not available
 * 
 * Note: This hook is kept for backward compatibility.
 * Main initialization happens in LoadingScreen.tsx
 */
export function useTelegramUser() {
  const { setTelegramUser } = useUser()

  useEffect(() => {
    // Initialize Telegram WebApp
    const result = initTelegramWebApp()
    
    // Set user data if available
    if (result.user) {
      setTelegramUser(result.user)
    }

    // Try to authenticate with backend if initData is available (non-blocking)
    const wa = getTelegramWebApp()
    const initData = wa?.initData
    if (initData && initData.length > 0) {
      // Authenticate in background, don't block UI
      const authenticate = async () => {
        try {
          const apiEndpoint = apiUrl('/api/auth/telegram')
          if (!apiEndpoint) {
            console.warn('API URL is not configured, skipping backend auth')
            return
          }

          const response = await fetch(apiEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ initData }),
          })

          if (response.ok && result.user) {
            // Refresh user data from backend (re-set Telegram user)
            setTelegramUser(result.user)
          }
          // Silent fail - user can still use the app as guest
        } catch (error) {
          // Silent fail - user can still use the app as guest
          console.warn('Backend auth error, continuing as guest:', error)
        }
      }

      authenticate()
    }
  }, [setTelegramUser])
}

