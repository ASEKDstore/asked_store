import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react'
import { getTelegramUser, type TgUser } from '../utils/telegram'

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
  const [user, setUser] = useState<User | null>(() => {
    // Try to get user from Telegram WebApp on mount
    const tgUser = getTelegramUser()
    if (tgUser) {
      return {
        id: tgUser.tgId,
        tgId: tgUser.tgId,
        first_name: tgUser.firstName,
        last_name: tgUser.lastName,
        firstName: tgUser.firstName,
        lastName: tgUser.lastName,
        username: tgUser.username,
        photo_url: tgUser.photoUrl,
        photoUrl: tgUser.photoUrl,
        avatar: tgUser.photoUrl,
      }
    }
    return null
  })

  const refresh = useCallback(() => {
    const tgUser = getTelegramUser()
    if (tgUser) {
      setUser((prevState) => {
        // If prevState is null, create new User object
        if (prevState === null) {
          return {
            id: tgUser.tgId,
            tgId: tgUser.tgId,
            first_name: tgUser.firstName,
            last_name: tgUser.lastName,
            firstName: tgUser.firstName,
            lastName: tgUser.lastName,
            username: tgUser.username,
            photo_url: tgUser.photoUrl,
            photoUrl: tgUser.photoUrl,
            avatar: tgUser.photoUrl,
          }
        }
        // Otherwise, merge with existing state
        return {
          ...prevState,
          id: tgUser.tgId,
          tgId: tgUser.tgId,
          first_name: tgUser.firstName,
          last_name: tgUser.lastName,
          firstName: tgUser.firstName,
          lastName: tgUser.lastName,
          username: tgUser.username,
          photo_url: tgUser.photoUrl,
          photoUrl: tgUser.photoUrl,
          avatar: tgUser.photoUrl,
        }
      })
    } else {
      setUser(null)
    }
  }, [])

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
  }

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>
}

function useUser() {
  const ctx = useContext(UserContext)
  if (!ctx) throw new Error('useUser must be used within UserProvider')
  return ctx
}

export { useUser }
