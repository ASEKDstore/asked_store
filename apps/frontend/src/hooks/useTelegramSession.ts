import { useState, useEffect, useRef } from 'react'

export type TelegramSessionStatus = 'boot' | 'authing' | 'ready' | 'error'

export type TelegramProfile = {
  telegram_id: number
  username?: string
  first_name?: string
  last_name?: string
  avatar_url?: string
}

export type UseTelegramSessionResult = {
  status: TelegramSessionStatus
  displayName: string | null // For greeting on loader
  profile: TelegramProfile | null
  token: string | null
  error: string | null
}

const TOKEN_STORAGE_KEY = 'asked_telegram_token'

/**
 * Hook for Telegram WebApp session management
 * Handles authentication flow: boot -> authing -> ready/error
 * Only works on client-side
 */
export function useTelegramSession(): UseTelegramSessionResult {
  const [status, setStatus] = useState<TelegramSessionStatus>('boot')
  const [displayName, setDisplayName] = useState<string | null>(null)
  const [profile, setProfile] = useState<TelegramProfile | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  const hasInitializedRef = useRef(false)

  useEffect(() => {
    // Only run on client
    if (typeof window === 'undefined' || hasInitializedRef.current) {
      return
    }

    hasInitializedRef.current = true

    const initializeSession = async () => {
      try {
        const tg = window.Telegram?.WebApp

        // Debug logging
        console.log('[useTelegramSession] WebApp exists:', !!tg)
        console.log('[useTelegramSession] initData exists:', !!tg?.initData)
        console.log('[useTelegramSession] initData length:', tg?.initData?.length || 0)

        // If no Telegram WebApp, set error state (but don't show instruction screen)
        if (!tg) {
          console.error('[useTelegramSession] Telegram WebApp not found')
          setStatus('error')
          setError('Не удалось получить данные Telegram. Перезапусти через /start.')
          return
        }

        // Initialize WebApp
        tg.ready?.()
        tg.expand?.()

        // Get initData and unsafe user for display name
        const initData = tg.initData
        const unsafeUser = tg.initDataUnsafe?.user

        // Debug logging
        console.log('[useTelegramSession] initData:', initData ? `${initData.substring(0, 50)}...` : 'empty')
        console.log('[useTelegramSession] initData length:', initData?.length || 0)
        console.log('[useTelegramSession] unsafeUser:', unsafeUser)

        // Set display name for greeting (from unsafeUser, just for UI)
        if (unsafeUser) {
          const name = unsafeUser.first_name || unsafeUser.username || null
          setDisplayName(name)
        }

        // Check if we have a stored token
        const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY)
        if (storedToken) {
          // TODO: Validate token with backend (optional)
          // For now, proceed to auth
        }

        // Start authentication
        setStatus('authing')

        // Import apiUrl (use dynamic import to avoid circular dependencies)
        const { apiUrl } = await import('../utils/api')
        const backendUrl = apiUrl('/api/auth/telegram')
        
        // Debug logging
        console.log('[useTelegramSession] backendUrl:', backendUrl)
        console.log('[useTelegramSession] About to fetch /api/auth/telegram')
        console.log('[useTelegramSession] initData available:', !!initData)

        // If no initData, set error and return (cannot proceed without initData)
        if (!initData) {
          console.error('[useTelegramSession] Cannot fetch: initData is empty')
          setStatus('error')
          setError('Не удалось получить данные Telegram. Перезапусти через /start.')
          return
        }

        const response = await fetch(backendUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ initData }),
        })

        console.log('[useTelegramSession] Response status:', response.status)

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Authentication failed' }))
          setStatus('error')
          setError(errorData.error || 'Не удалось авторизоваться. Перезапусти через /start.')
          return
        }

        const data = await response.json()
        const { token: newToken, user } = data

        // Store token
        if (newToken) {
          localStorage.setItem(TOKEN_STORAGE_KEY, newToken)
          setToken(newToken)
        }

        // Set profile
        setProfile({
          telegram_id: user.telegram_id,
          username: user.username,
          first_name: user.first_name,
          last_name: user.last_name,
          avatar_url: user.avatar_url,
        })

        // Update display name from validated user
        if (user.first_name || user.username) {
          setDisplayName(user.first_name || user.username || null)
        }

        setStatus('ready')

        if (import.meta.env.DEV) {
          console.log('[useTelegramSession] Authentication successful:', { token: newToken ? 'present' : 'missing', user })
        }
      } catch (err) {
        console.error('[useTelegramSession] Error:', err)
        setStatus('error')
        setError('Ошибка при загрузке. Перезапусти через /start.')
      }
    }

    initializeSession()
  }, [])

  return {
    status,
    displayName,
    profile,
    token,
    error,
  }
}

/**
 * Get stored token
 */
export function getStoredToken(): string | null {
  if (typeof window === 'undefined') {
    return null
  }
  return localStorage.getItem(TOKEN_STORAGE_KEY)
}

/**
 * Clear stored token
 */
export function clearStoredToken(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(TOKEN_STORAGE_KEY)
  }
}

