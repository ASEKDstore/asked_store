import { useState } from 'react'
import { useUser } from '../context/UserContext'
import { loginWithTelegram } from '../services/telegramAuth'

export function useTelegramAuth() {
  const { refresh } = useUser()
  const [isAuthenticating, setIsAuthenticating] = useState(false)

  const handleLogin = async () => {
    setIsAuthenticating(true)
    try {
      // Refresh user data from Telegram WebApp
      refresh()
      // Small delay to allow refresh to complete
      await new Promise(resolve => setTimeout(resolve, 100))
    } catch (error) {
      console.error('Telegram login error:', error)
      throw error
    } finally {
      setIsAuthenticating(false)
    }
  }

  return { handleLogin, isAuthenticating }
}


