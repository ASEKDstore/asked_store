import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react'

export type User = {
  id: number
  firstName?: string
  lastName?: string
  username?: string
  photo_url?: string
  first_name?: string
  last_name?: string
  language_code?: string
}

type UserContextValue = {
  user: User | null
  displayName: string
  initials: string
  isTelegram: boolean
  refresh: () => void
}

const UserContext = createContext<UserContextValue | null>(null)

// Telegram WebApp types
declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
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
      }
    }
  }
}

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    // Try to get user from Telegram WebApp on mount
    if (typeof window !== 'undefined' && window.Telegram?.WebApp?.initDataUnsafe?.user) {
      const tgUser = window.Telegram.WebApp.initDataUnsafe.user
      return {
        id: tgUser.id,
        first_name: tgUser.first_name,
        last_name: tgUser.last_name,
        firstName: tgUser.first_name,
        lastName: tgUser.last_name,
        username: tgUser.username,
        photo_url: tgUser.photo_url,
      }
    }
    return null
  })

  const refresh = useCallback(() => {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp?.initDataUnsafe?.user) {
      const tgUser = window.Telegram.WebApp.initDataUnsafe.user
      setUser({
        id: tgUser.id,
        first_name: tgUser.first_name,
        last_name: tgUser.last_name,
        firstName: tgUser.first_name,
        lastName: tgUser.last_name,
        username: tgUser.username,
        photo_url: tgUser.photo_url,
      })
    } else {
      setUser(null)
    }
  }, [])

  useEffect(() => {
    // Initialize Telegram WebApp if available
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      window.Telegram.WebApp.ready?.()
      refresh()
    }
  }, [refresh])

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
  }

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>
}

function useUser() {
  const ctx = useContext(UserContext)
  if (!ctx) throw new Error('useUser must be used within UserProvider')
  return ctx
}

export { useUser }
