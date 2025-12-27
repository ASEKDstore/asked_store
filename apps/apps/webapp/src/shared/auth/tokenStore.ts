// Token storage (memory + localStorage)

const TOKEN_KEY = 'asked_store_token'

// In-memory token storage (for immediate access)
let tokenMemory: string | null = null

/**
 * Save token to both memory and localStorage
 */
export function saveToken(token: string): void {
  tokenMemory = token
  try {
    localStorage.setItem(TOKEN_KEY, token)
  } catch (error) {
    console.warn('Failed to save token to localStorage:', error)
  }
}

/**
 * Get token from memory (preferred) or localStorage
 */
export function getToken(): string | null {
  if (tokenMemory) {
    return tokenMemory
  }

  try {
    const stored = localStorage.getItem(TOKEN_KEY)
    if (stored) {
      tokenMemory = stored
      return stored
    }
  } catch (error) {
    console.warn('Failed to read token from localStorage:', error)
  }

  return null
}

/**
 * Remove token from both memory and localStorage
 */
export function clearToken(): void {
  tokenMemory = null
  try {
    localStorage.removeItem(TOKEN_KEY)
  } catch (error) {
    console.warn('Failed to remove token from localStorage:', error)
  }
}

/**
 * Check if token exists
 */
export function hasToken(): boolean {
  return getToken() !== null
}

