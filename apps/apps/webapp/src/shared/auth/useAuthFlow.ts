// Auth flow hook - handles Telegram WebApp authentication

import { useEffect } from 'react'
import { useTelegram } from '../../features/telegram/useTelegram.js'
import { useAuth } from './AuthContext.js'

/**
 * Hook to handle authentication flow on app initialization
 * - Gets initData from Telegram WebApp
 * - Calls POST /auth/telegram
 * - Updates auth context
 */
export function useAuthFlow() {
  const { telegram, isAvailable, initData } = useTelegram()
  const { login, isAuthenticated, isLoading } = useAuth()

  useEffect(() => {
    // Only attempt login if:
    // 1. Telegram WebApp is available
    // 2. initData exists
    // 3. User is not already authenticated
    // 4. Not currently loading
    if (!isAvailable || !initData || isAuthenticated || isLoading) {
      return
    }

    // Attempt authentication
    login(initData).catch((error) => {
      console.error('Authentication failed:', error)
      // Error handling is done in login function
    })
  }, [isAvailable, initData, isAuthenticated, isLoading, login])
}

