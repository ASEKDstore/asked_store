/**
 * Centralized API client with automatic authorization headers
 * 
 * Features:
 * - Automatically adds Authorization Bearer token if available
 * - Fallback to x-tg-id header if token is missing
 * - Handles 401 errors with automatic retry (one attempt)
 * - Timeout support via AbortController
 */

import { apiUrl } from '../utils/api'

// Token storage
let token: string | null = null

/**
 * Get token from localStorage or memory
 */
export function getToken(): string | null {
  if (token) {
    return token
  }
  return localStorage.getItem('asked_telegram_token')
}

/**
 * Set token (memory + localStorage)
 */
export function setToken(newToken: string | null) {
  token = newToken
  if (newToken) {
    localStorage.setItem('asked_telegram_token', newToken)
  } else {
    localStorage.removeItem('asked_telegram_token')
  }
}

/**
 * Get Telegram user ID from window.Telegram.WebApp
 */
function getTelegramUserId(): number | null {
  try {
    const tg = window.Telegram?.WebApp
    const userId = tg?.initDataUnsafe?.user?.id
    return userId ? Number(userId) : null
  } catch {
    return null
  }
}

/**
 * Build authorization headers
 */
function buildAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {}
  
  const currentToken = getToken()
  if (currentToken) {
    headers['Authorization'] = `Bearer ${currentToken}`
  } else {
    // Fallback to x-tg-id if token is missing
    const tgId = getTelegramUserId()
    if (tgId) {
      headers['x-tg-id'] = String(tgId)
    }
  }
  
  return headers
}

/**
 * Perform authentication flow (POST /api/auth/telegram)
 * Returns new token or null if failed
 */
async function performAuth(): Promise<string | null> {
  try {
    const tg = window.Telegram?.WebApp
    const initData = tg?.initData || ''
    
    if (!initData) {
      console.warn('[apiClient] No initData available for auth retry')
      return null
    }
    
    const backendUrl = (import.meta as any).env?.VITE_BACKEND_URL || 
                      (import.meta as any).env?.VITE_API_URL || 
                      (import.meta as any).env?.VITE_API_BASE || ''
    
    if (!backendUrl) {
      console.warn('[apiClient] No backend URL configured for auth retry')
      return null
    }
    
    // Normalize backend URL
    let normalizedUrl = backendUrl.trim()
    if (!normalizedUrl.startsWith('https://') && !normalizedUrl.startsWith('http://')) {
      normalizedUrl = `https://${normalizedUrl}`
    }
    if (normalizedUrl.endsWith('/')) {
      normalizedUrl = normalizedUrl.slice(0, -1)
    }
    
    const authUrl = `${normalizedUrl}/api/auth/telegram`
    
    console.log('[apiClient] Retrying auth flow...')
    
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000)
    
    try {
      const response = await fetch(authUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initData }),
        signal: controller.signal,
      })
      
      clearTimeout(timeoutId)
      
      if (!response.ok) {
        console.error('[apiClient] Auth retry failed:', response.status, response.statusText)
        return null
      }
      
      const data = await response.json()
      if (data.token) {
        setToken(data.token)
        console.log('[apiClient] Auth retry successful, token refreshed')
        return data.token
      }
      
      return null
    } catch (error) {
      clearTimeout(timeoutId)
      console.error('[apiClient] Auth retry error:', error)
      return null
    }
  } catch (error) {
    console.error('[apiClient] Auth retry setup error:', error)
    return null
  }
}

export interface RequestOptions extends RequestInit {
  timeoutMs?: number
  skipAuth?: boolean // Skip auth headers (for public endpoints)
  retryOn401?: boolean // Retry on 401 (default: true)
}

/**
 * Centralized API request function
 * 
 * @param path - API path (e.g., "/api/admin/orders")
 * @param options - Fetch options + timeoutMs, skipAuth, retryOn401
 * @returns Promise<Response>
 */
export async function request(
  path: string,
  options: RequestOptions = {}
): Promise<Response> {
  const {
    timeoutMs = 15000,
    skipAuth = false,
    retryOn401 = true,
    headers = {},
    ...fetchOptions
  } = options
  
  // Build headers
  const requestHeaders: Record<string, string> = {
    ...(typeof headers === 'object' && !Array.isArray(headers) 
      ? Object.fromEntries(
          Object.entries(headers).map(([k, v]) => [k, String(v)])
        )
      : {}),
  }
  
  // Add Content-Type if body is present
  if (fetchOptions.body && !requestHeaders['Content-Type']) {
    requestHeaders['Content-Type'] = 'application/json'
  }
  
  // Add auth headers if not skipped
  if (!skipAuth) {
    const authHeaders = buildAuthHeaders()
    Object.assign(requestHeaders, authHeaders)
  }
  
  // Build full URL
  const url = apiUrl(path)
  
  // Create AbortController for timeout
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
  
  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers: requestHeaders,
      signal: controller.signal,
    })
    
    clearTimeout(timeoutId)
    
    // Handle 401 Unauthorized
    if (response.status === 401 && retryOn401 && !skipAuth) {
      console.log('[apiClient] Received 401, attempting auth retry...')
      
      // Try to refresh token
      const newToken = await performAuth()
      
      if (newToken) {
        // Retry original request with new token
        console.log('[apiClient] Retrying original request with new token...')
        
        // Rebuild headers with new token
        const retryHeaders: Record<string, string> = {
          ...requestHeaders,
          'Authorization': `Bearer ${newToken}`,
        }
        delete retryHeaders['x-tg-id'] // Remove x-tg-id if it was there
        
        const retryController = new AbortController()
        const retryTimeoutId = setTimeout(() => retryController.abort(), timeoutMs)
        
        try {
          const retryResponse = await fetch(url, {
            ...fetchOptions,
            headers: retryHeaders,
            signal: retryController.signal,
          })
          clearTimeout(retryTimeoutId)
          
          // If retry still returns 401, don't retry again (prevent infinite loop)
          if (retryResponse.status === 401) {
            console.warn('[apiClient] Retry still returned 401, session may be invalid')
            // Dispatch custom event for UI to handle
            window.dispatchEvent(new CustomEvent('session-expired'))
          }
          
          return retryResponse
        } catch (retryError) {
          clearTimeout(retryTimeoutId)
          throw retryError
        }
      } else {
        // Auth retry failed, dispatch event for UI
        console.warn('[apiClient] Auth retry failed, session expired')
        window.dispatchEvent(new CustomEvent('session-expired'))
        return response
      }
    }
    
    return response
  } catch (error) {
    clearTimeout(timeoutId)
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeoutMs}ms`)
    }
    throw error
  }
}

/**
 * Convenience method for JSON requests
 * Automatically parses JSON response
 */
export async function requestJson<T = any>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const response = await request(path, options)
  
  // Read response text first (before checking ok)
  const text = await response.text().catch(() => '')
  
  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`
    try {
      const errorData = text ? JSON.parse(text) : {}
      if (errorData.message) {
        errorMessage = `HTTP ${response.status}: ${errorData.message}`
      } else if (errorData.error) {
        errorMessage = `HTTP ${response.status}: ${errorData.error}`
      } else if (text) {
        errorMessage = `HTTP ${response.status}: ${text}`
      }
    } catch {
      if (text) {
        errorMessage = `HTTP ${response.status}: ${text}`
      }
    }
    throw new Error(errorMessage)
  }
  
  return text ? JSON.parse(text) : ({} as T)
}

// Export token management functions
export { setToken as setApiToken, getToken as getApiToken }

