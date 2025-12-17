import React, { createContext, useContext, useState, useMemo, useCallback } from 'react'
import { normalizeTelegramUser } from '../services/telegram/normalizeTelegramUser'

export type UserSource = 'telegram' | 'guest'

export interface User {
  // Telegram raw fields (for old code compatibility)
  id: number // TELEGRAM USER ID (required, main field)
  first_name?: string
  last_name?: string
  username?: string
  photo_url?: string

  // Normalized aliases (for new code/components)
  tgId?: number
  firstName?: string
  lastName?: string
  photoUrl?: string
  avatar?: string
  name?: string

  source: UserSource
  isAdmin?: boolean
}

type UserContextValue = {
  user: User | null // null = guest mode
  displayName: string
  initials: string
  isTelegram: boolean
  browserMode: boolean // true if opened as regular URL (not WebApp)
  refresh: () => void
  setTelegramUser: (tgUser: any) => void // Normalizes and sets user from Telegram
  setFromTelegram: (tgUser: { id: number; first_name?: string; last_name?: string; username?: string; photo_url?: string } | null) => void // Legacy alias
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

  const setTelegramUser = useCallback((tgUser: any) => {
    // If no user or invalid id, set to null (guest mode)
    if (!tgUser?.id) {
      setUser(null)
      setBrowserMode(true)
      return
    }

    try {
      const normalized = normalizeTelegramUser(tgUser)
      setUser((prev: User | null) => (prev ? { ...prev, ...normalized } : normalized))
      setBrowserMode(false)
    } catch (error) {
      // Invalid user data - set to null
      if (import.meta.env.DEV) {
        console.warn('[UserContext] Failed to normalize Telegram user:', error)
      }
      setUser(null)
      setBrowserMode(true)
    }
  }, [])

  // Legacy alias for backward compatibility
  const setFromTelegram = useCallback((tgUser: { id: number; first_name?: string; last_name?: string; username?: string; photo_url?: string } | null) => {
    setTelegramUser(tgUser)
  }, [setTelegramUser])

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
    return user.name || user.firstName || user.first_name || user.username || 'Гость'
  }, [user])

  const initials = useMemo(() => {
    if (!user) return 'Г'
    const name = user.name || [user.firstName || user.first_name, user.lastName || user.last_name].filter(Boolean).join(' ')
    if (name) {
      const parts = name.split(' ')
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
      }
      return name[0].toUpperCase()
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
