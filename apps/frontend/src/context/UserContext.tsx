import React, { createContext, useContext, useState, useMemo, useCallback, useEffect } from 'react'
import type { User, TgUser } from '../types/user'
import { useAuth } from './AuthContext'

// Get admin IDs from env
const getAdminIds = (): number[] => {
  const envValue = import.meta.env.VITE_ADMIN_TG_IDS || ''
  return envValue
    .split(',')
    .map((s: string) => Number(s.trim()))
    .filter((n: number) => Number.isFinite(n) && n > 0)
}

type UserContextValue = {
  user: User // Always defined (guest = {source:'guest', tgId:0})
  displayName: string
  initials: string
  isTelegram: boolean
  telegramStatus: 'loading' | 'telegram' | 'browser'
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
  // Use Auth context (replaces useTelegramSession)
  const { status, token, role } = useAuth()
  
  // Initialize with guest user (never null)
  const [user, setUser] = useState<User>({ source: 'guest', tgId: 0 })

  // Get user data from Telegram WebApp initDataUnsafe
  useEffect(() => {
    if (status === 'ready' && token) {
      // Try to get user from initDataUnsafe
      const tg = window.Telegram?.WebApp
      const unsafeUser = tg?.initDataUnsafe?.user
      
      if (unsafeUser && unsafeUser.id) {
        // Use role from backend auth response (more reliable than env check)
        const isAdmin = role === 'admin'

        const newUser: User = {
          source: 'telegram',
          tgId: unsafeUser.id,
          firstName: unsafeUser.first_name || undefined,
          lastName: unsafeUser.last_name || undefined,
          username: unsafeUser.username || undefined,
          avatar: unsafeUser.photo_url || undefined,
          isAdmin,
        }

        setUser(newUser)

        if (import.meta.env.DEV) {
          console.log('[UserContext] User authenticated:', newUser, 'role:', role)
        }
      } else {
        // Token exists but no user data - set guest
        setUser({ source: 'guest', tgId: 0 })
      }
    } else if (status === 'error') {
      // Error state - set guest
      setUser({ source: 'guest', tgId: 0 })
    }
  }, [status, token, role])

  const refresh = useCallback(() => {
    // Refresh will be handled by useTelegramSession hook
    // This is a no-op for now, session manages its own state
    if (import.meta.env.DEV) {
      console.log('[UserContext] Refresh called, session manages state')
    }
  }, [])


  const displayName = useMemo(() => {
    if (user.source === 'guest') return 'Гость'
    return user.firstName || user.username || 'Гость'
  }, [user])

  const initials = useMemo(() => {
    if (user.source === 'guest') return 'Г'
    const name = [user.firstName, user.lastName].filter(Boolean).join(' ')
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
    return status === 'ready' && user.source === 'telegram'
  }, [status, user.source])

  const telegramStatus = useMemo(() => {
    if (status === 'ready') return 'telegram'
    if (status === 'error') return 'browser'
    return 'loading'
  }, [status])

  const value: UserContextValue = {
    user,
    displayName,
    initials,
    isTelegram,
    telegramStatus,
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
