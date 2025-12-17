import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react'
import type { TelegramUser } from '../lib/telegram'

export type User = {
  id: number
  tgId?: number
  firstName?: string
  lastName?: string
  username?: string
  photo_url?: string
  photoUrl?: string
  avatar?: string
  first_name?: string
  last_name?: string
  language_code?: string
  source?: 'telegram' | 'guest'
}

type UserContextValue = {
  user: User | null
  displayName: string
  initials: string
  isTelegram: boolean
  refresh: () => void
  setTelegramUser: (user: TelegramUser | null) => void
  setFromTelegram: (user: TelegramUser | null, initData?: string) => Promise<void>
}

const UserContext = createContext<UserContextValue | null>(null)

// Telegram WebApp types
declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initData?: string
        initDataUnsafe?: {
          user?: {
            id: number
            first_name?: string
            last_name?: string
            username?: string
            photo_url?: string
          }
        }
        ready?: () => void
        expand?: () => void
        platform?: string
        version?: string
      }
    }
  }
}

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)

  const setTelegramUser = useCallback((tgUser: TelegramUser | null) => {
    if (!tgUser) {
      // If user is null, set guest mode
      setUser((prev: User | null) => prev ?? { source: 'guest' })
      return
    }

    // Set user from Telegram
    setUser({
      tgId: tgUser.id,
      id: tgUser.id,
      username: tgUser.username,
      firstName: tgUser.first_name,
      lastName: tgUser.last_name,
      avatar: tgUser.photo_url,
      photo_url: tgUser.photo_url,
      photoUrl: tgUser.photo_url,
      first_name: tgUser.first_name,
      last_name: tgUser.last_name,
      source: 'telegram',
    })
  }, [])

  const setFromTelegram = useCallback(async (tgUser: TelegramUser | null, initData?: string) => {
    // If no user, don't break guest mode
    if (!tgUser) {
      return
    }

    // Set user from Telegram immediately
    setUser((prevState) => {
      const newUser: User = {
        id: tgUser.id,
        tgId: tgUser.id,
        first_name: tgUser.first_name,
        last_name: tgUser.last_name,
        firstName: tgUser.first_name,
        lastName: tgUser.last_name,
        username: tgUser.username,
        photo_url: tgUser.photo_url,
        photoUrl: tgUser.photo_url,
        avatar: tgUser.photo_url,
        source: 'telegram',
      }

      if (prevState === null) {
        return newUser
      }

      return {
        ...prevState,
        ...newUser,
      }
    })

    // If initData is available, try to authenticate with backend (non-blocking)
    if (initData && initData.length > 0) {
      try {
        const { apiUrl } = await import('../utils/api')
        const endpoint = apiUrl('/api/auth/telegram')
        
        if (endpoint) {
          // Use AbortController with timeout
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 3000)

          const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ initData }),
            signal: controller.signal,
          })

          clearTimeout(timeoutId)

          if (response.ok) {
            // Backend may return normalized user profile
            const data = await response.json()
            if (data.user) {
              // Update user with backend data if available
              setUser((prevState) => ({
                ...prevState,
                ...data.user,
                source: 'telegram',
              }))
            }
          }
        }
      } catch (error) {
        // Silent fail - user can still use the app with Telegram user data
        if (import.meta.env.DEV) {
          console.warn('Backend auth error, continuing with Telegram user:', error)
        }
      }
    }
  }, [])

  const refresh = useCallback(() => {
    // Refresh is kept for backward compatibility
    // Actual user sync is done via setTelegramUser in LoadingScreen
    // This method can be called to re-read Telegram user data
    if (typeof window !== 'undefined') {
      const wa = (window as any).Telegram?.WebApp
      const tgUser = wa?.initDataUnsafe?.user
      if (tgUser) {
        setTelegramUser({
          id: tgUser.id,
          username: tgUser.username,
          first_name: tgUser.first_name,
          last_name: tgUser.last_name,
          photo_url: tgUser.photo_url,
        })
      } else {
        // Don't clear user on refresh if Telegram is not available
        // This allows guest mode to persist
      }
    }
  }, [setTelegramUser])

  // User data is synced via useTelegramUser hook in LoadingScreen/App
  // This effect is kept for backward compatibility but refresh is called from useTelegramUser

  const displayName = useMemo(() => {
    if (!user) return 'ASKED'
    return user.firstName || user.first_name || user.username || 'ASKED'
  }, [user])

  const initials = useMemo(() => {
    if (!user) return 'A'
    const first = user.firstName || user.first_name || ''
    const last = user.lastName || user.last_name || ''
    if (first && last) {
      return `${first[0]}${last[0]}`.toUpperCase()
    }
    if (first) {
      return first[0].toUpperCase()
    }
    if (user.username) {
      return user.username[0].toUpperCase()
    }
    return 'A'
  }, [user])

  const isTelegram = useMemo(() => {
    return typeof window !== 'undefined' && !!window.Telegram?.WebApp
  }, [])

  const value: UserContextValue = {
    user,
    displayName,
    initials,
    isTelegram,
    refresh,
    setTelegramUser,
    setFromTelegram,
  }

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>
}

function useUser() {
  const ctx = useContext(UserContext)
  if (!ctx) throw new Error('useUser must be used within UserProvider')
  return ctx
}

export { useUser }
