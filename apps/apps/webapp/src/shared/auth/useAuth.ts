import { useCallback } from 'react'
import type { AuthResponse } from '../types'
import { apiClient } from '../api/apiClient'
import { tokenStore } from './tokenStore'

/**
 * Hook для работы с авторизацией
 */
export function useAuth() {
  const isAuthenticated = useCallback((): boolean => {
    return tokenStore.has()
  }, [])

  const login = useCallback(async (initData: string): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/telegram', {
      initData,
    })

    if (!response.ok || !response.data) {
      throw new Error(response.error || 'Ошибка авторизации')
    }

    if (response.data.token) {
      tokenStore.set(response.data.token)
    }

    return response.data
  }, [])

  const logout = useCallback(() => {
    tokenStore.remove()
  }, [])

  const getToken = useCallback((): string | null => {
    return tokenStore.get()
  }, [])

  return {
    isAuthenticated,
    login,
    logout,
    getToken,
  }
}
