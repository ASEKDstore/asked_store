import React, { createContext, useContext, useState, useMemo, useCallback } from 'react'

export type User = {
  telegramId: number // Required: Telegram ID
  name?: string // first_name + last_name combined
  username?: string
  avatar?: string // photo_url
  source: 'telegram' // Required
}

type UserContextValue = {
  user: User | null // null = guest mode
  displayName: string
  initials: string
  isTelegram: boolean
  browserMode: boolean // true if opened as regular URL (not WebApp)
  refresh: () => void
  setFromTelegram: (tgUser: { id: number; first_name?: string; last_name?: string; username?: string; photo_url?: string } | null) => void
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
  const [browserMode, setBrowserMode] = useState(false)

  const setFromTelegram = useCallback((tgUser: { id: number; first_name?: string; last_name?: string; username?: string; photo_url?: string } | null) => {
    // If no user, set to null (guest mode)
    if (!tgUser) {
      setUser(null)
      setBrowserMode(true)
      return
    }

    // Normalize user data from Telegram
    // id → telegramId
    // first_name + last_name → name
    // photo_url → avatar
    const name = [tgUser.first_name, tgUser.last_name].filter(Boolean).join(' ') || undefined

    const normalizedUser: User = {
      telegramId: tgUser.id, // Required: Telegram ID
      name,
      username: tgUser.username,
      avatar: tgUser.photo_url,
      source: 'telegram', // Required
    }

    // Set user from Telegram
    setUser(normalizedUser)
    setBrowserMode(false)
  }, [])

  const refresh = useCallback(() => {
    // Re-read Telegram user data from WebApp
    if (typeof window !== 'undefined') {
      const wa = (window as any).Telegram?.WebApp
      const tgUser = wa?.initDataUnsafe?.user || null
      
      setFromTelegram(tgUser)
    }
  }, [setFromTelegram])

  // User data is synced via useTelegramUser hook in LoadingScreen/App
  // This effect is kept for backward compatibility but refresh is called from useTelegramUser

  const displayName = useMemo(() => {
    if (!user) return 'Гость'
    return user.name || user.username || 'Гость'
  }, [user])

  const initials = useMemo(() => {
    if (!user) return 'Г'
    if (user.name) {
      const parts = user.name.split(' ')
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
      }
      return user.name[0].toUpperCase()
    }
    if (user.username) {
      return user.username[0].toUpperCase()
    }
    return 'Г'
  }, [user])

  const isTelegram = useMemo(() => {
    return typeof window !== 'undefined' && !!window.Telegram?.WebApp
  }, [])

  const value: UserContextValue = {
    user,
    displayName,
    initials,
    isTelegram,
    browserMode,
    refresh,
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
