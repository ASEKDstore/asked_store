import { useEffect } from 'react'
import { initTelegram } from '../lib/telegram'
import { useUser } from '../context/UserContext'

/**
 * Hook to initialize Telegram WebApp and sync user data
 * - Calls tg.ready() and tg.expand() if available
 * - Reads Telegram user data and saves to UserContext via setFromTelegram
 * - Tries to authenticate with backend if initData is available (non-blocking)
 * - Works in guest mode if Telegram is not available
 * 
 * Note: This hook is kept for backward compatibility.
 * Main initialization happens in LoadingScreen.tsx
 */
export function useTelegramUser() {
  const { setFromTelegram } = useUser()

  useEffect(() => {
    // Initialize Telegram WebApp
    const result = initTelegram()
    
    // Set user from Telegram if available (non-blocking)
    if (result.user) {
      setFromTelegram(result.user)
    }
  }, [setFromTelegram])
}

