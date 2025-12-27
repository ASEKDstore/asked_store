// Authentication context and provider

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { authenticateWithTelegram } from '../api/apiClient.js'
import { getToken, clearToken } from './tokenStore.js'
import type { UserProfile } from '@asked-store/shared'

interface AuthContextType {
  user: UserProfile | null
  isAuthenticated: boolean
  isAdmin: boolean
  roles: string[]
  login: (initData: string) => Promise<void>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

/**
 * AuthProvider component - manages authentication state
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Check if user has admin.access permission (via roles)
  const isAdmin = user?.roles.includes('admin') || user?.roles.includes('owner') || false
  const roles = user?.roles || []
  const isAuthenticated = user !== null

  /**
   * Login with Telegram initData
   */
  const login = async (initData: string) => {
    try {
      const response = await authenticateWithTelegram(initData)
      setUser({
        ...response.user,
        createdAt: new Date(response.user.createdAt),
        updatedAt: new Date(response.user.updatedAt),
      })
    } catch (error) {
      console.error('Login failed:', error)
      clearToken()
      throw error
    }
  }

  /**
   * Logout - clear token and user state
   */
  const logout = () => {
    clearToken()
    setUser(null)
  }

  // Initialize auth state on mount
  useEffect(() => {
    const token = getToken()
    if (!token) {
      setIsLoading(false)
      return
    }

    // Token exists, but we don't have user data
    // User will need to re-authenticate on next request
    // Or we could fetch user profile here
    setIsLoading(false)
  }, [])

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isAdmin,
    roles,
    login,
    logout,
    isLoading,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/**
 * Hook to access auth context
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

