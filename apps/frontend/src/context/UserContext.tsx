import React, { createContext, useContext, useState, useMemo, useCallback, useEffect } from 'react'
import type { User, TgUser } from '../types/user'
import { useTelegramWebApp } from '../hooks/useTelegramWebApp'

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
  // Use Telegram WebApp hook for status detection
  const { status: telegramStatus, user: tgUser, initData } = useTelegramWebApp()
  
  // Initialize with guest user (never null)
  const [user, setUser] = useState<User>({ source: 'guest', tgId: 0 })

  // Update user when Telegram user is available
  useEffect(() => {
    if (telegramStatus === 'telegram' && tgUser && typeof tgUser.id === 'number' && initData) {
      const authenticateUser = async () => {
        try {
          // Send initData to backend for validation
          const { apiUrl } = await import('../utils/api')
          const response = await fetch(apiUrl('/api/auth/telegram'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ initData }),
          })

          if (response.ok) {
            const data = await response.json()
            const validatedUser = data.user

            // Map validated user to User type
            const adminIds = getAdminIds()
            const isAdmin = adminIds.includes(validatedUser.id)

            const newUser: User = {
              source: 'telegram',
              tgId: validatedUser.id,
              firstName: validatedUser.first_name,
              lastName: validatedUser.last_name,
              username: validatedUser.username,
              avatar: validatedUser.photo_url,
              isAdmin,
            }

            setUser(newUser)

            if (import.meta.env.DEV) {
              console.log('[UserContext] User authenticated via backend:', newUser)
            }
          } else {
            // Backend validation failed - fallback to initDataUnsafe (dev only)
            if (import.meta.env.DEV) {
              console.warn('[UserContext] Backend validation failed, using initDataUnsafe as fallback')
            }
            
            const adminIds = getAdminIds()
            const isAdmin = adminIds.includes(tgUser.id)

            const newUser: User = {
              source: 'telegram',
              tgId: tgUser.id,
              firstName: tgUser.first_name,
              lastName: tgUser.last_name,
              username: tgUser.username,
              avatar: tgUser.photo_url,
              isAdmin,
            }

            setUser(newUser)
          }
        } catch (error) {
          // Network error - fallback to initDataUnsafe
          if (import.meta.env.DEV) {
            console.warn('[UserContext] Network error during auth, using initDataUnsafe:', error)
          }

          const adminIds = getAdminIds()
          const isAdmin = adminIds.includes(tgUser.id)

          const newUser: User = {
            source: 'telegram',
            tgId: tgUser.id,
            firstName: tgUser.first_name,
            lastName: tgUser.last_name,
            username: tgUser.username,
            avatar: tgUser.photo_url,
            isAdmin,
          }

          setUser(newUser)
        }
      }

      authenticateUser()
    } else if (telegramStatus === 'browser') {
      // Browser mode - set guest
      setUser({ source: 'guest', tgId: 0 })
    }
    // If status === 'loading', keep current user state
  }, [telegramStatus, tgUser, initData])

  const refresh = useCallback(async () => {
    // Re-read Telegram user data from WebApp and validate with backend
    // Use current telegramStatus, tgUser, and initData from useTelegramWebApp hook
    if (telegramStatus === 'telegram' && tgUser && typeof tgUser.id === 'number' && initData) {
      try {
        // Send initData to backend for validation
        const { apiUrl } = await import('../utils/api')
        const response = await fetch(apiUrl('/api/auth/telegram'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ initData }),
        })

        if (response.ok) {
          const data = await response.json()
          const validatedUser = data.user

          const adminIds = getAdminIds()
          const isAdmin = adminIds.includes(validatedUser.id)

          const newUser: User = {
            source: 'telegram',
            tgId: validatedUser.id,
            firstName: validatedUser.first_name,
            lastName: validatedUser.last_name,
            username: validatedUser.username,
            avatar: validatedUser.photo_url,
            isAdmin,
          }

          setUser(newUser)
        } else {
          // Backend validation failed - fallback to initDataUnsafe
          const adminIds = getAdminIds()
          const isAdmin = adminIds.includes(tgUser.id)

          const newUser: User = {
            source: 'telegram',
            tgId: tgUser.id,
            firstName: tgUser.first_name,
            lastName: tgUser.last_name,
            username: tgUser.username,
            avatar: tgUser.photo_url,
            isAdmin,
          }

          setUser(newUser)
        }
      } catch (error) {
        // Network error - fallback to initDataUnsafe
        if (import.meta.env.DEV) {
          console.warn('[UserContext] Error refreshing user:', error)
        }
        
        const adminIds = getAdminIds()
        const isAdmin = adminIds.includes(tgUser.id)

        const newUser: User = {
          source: 'telegram',
          tgId: tgUser.id,
          firstName: tgUser.first_name,
          lastName: tgUser.last_name,
          username: tgUser.username,
          avatar: tgUser.photo_url,
          isAdmin,
        }

        setUser(newUser)
      }
    } else if (telegramStatus === 'browser') {
      setUser({ source: 'guest', tgId: 0 })
    }
  }, [telegramStatus, tgUser, initData])


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
    return telegramStatus === 'telegram'
  }, [telegramStatus])

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
