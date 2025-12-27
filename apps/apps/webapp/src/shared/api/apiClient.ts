// API client with automatic token injection

import { saveToken, clearToken, getToken } from '../auth/tokenStore.js'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

export interface ApiError {
  error: string
  details?: unknown
}

/**
 * API client with automatic Authorization header and token management
 */
export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken()
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  // Add Authorization header if token exists
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  })

  // Handle 401 Unauthorized - clear token and redirect to login
  if (response.status === 401) {
    clearToken()
    // Redirect to root will trigger auth flow
    window.location.href = '/'
    throw new Error('Unauthorized: Token expired or invalid')
  }

  if (!response.ok) {
    const error: ApiError = await response.json().catch(() => ({
      error: `HTTP ${response.status}: ${response.statusText}`,
    }))
    throw new Error(error.error || `HTTP ${response.status}`)
  }

  return response.json()
}

/**
 * Authenticate via Telegram initData
 */
export interface AuthResponse {
  token: string
  user: {
    id: string
    tgId: string
    username: string | null
    firstName: string | null
    lastName: string | null
    photoUrl: string | null
    roles: string[]
    createdAt: string
    updatedAt: string
  }
}

export async function authenticateWithTelegram(initData: string): Promise<AuthResponse> {
  const response = await apiClient<AuthResponse>('/auth/telegram', {
    method: 'POST',
    body: JSON.stringify({ initData }),
  })

  // Save token after successful authentication
  saveToken(response.token)

  return response
}

