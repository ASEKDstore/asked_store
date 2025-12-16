import { useEffect } from 'react'
import { getTelegramUser } from '../utils/telegram'
import { useUser } from '../context/UserContext'
import { apiUrl } from '../utils/api'

/**
 * Hook to initialize Telegram WebApp and sync user data
 * - Calls tg.ready() and tg.expand() if available
 * - Reads Telegram user data and saves to UserContext
 * - Tries to authenticate with backend if initData is available (non-blocking)
 * - Works in guest mode if Telegram is not available
 */
export function useTelegramUser() {
  const { refresh } = useUser()

  useEffect(() => {
    const tg = typeof window !== 'undefined' ? window.Telegram?.WebApp : undefined

    if (!tg) {
      // Not in Telegram WebApp - guest mode
      return
    }

    // Initialize Telegram WebApp
    tg?.ready?.()
    tg?.expand?.()

    // Sync user data from Telegram
    const tgUser = getTelegramUser()
    if (tgUser) {
      // Refresh user context with Telegram data
      refresh()
    }

    // Try to authenticate with backend if initData is available (non-blocking)
    const initData = tg?.initData
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

          if (response.ok) {
            // Refresh user data from backend
            refresh()
          }
          // Silent fail - user can still use the app as guest
        } catch (error) {
          // Silent fail - user can still use the app as guest
          console.warn('Backend auth error, continuing as guest:', error)
        }
      }

      authenticate()
    }
  }, [refresh])
}

