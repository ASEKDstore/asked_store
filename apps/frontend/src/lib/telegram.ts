/**
 * Telegram WebApp utilities
 * Provides functions to interact with Telegram Mini App API
 */

export type TelegramUser = {
  id: number
  username?: string
  first_name?: string
  last_name?: string
  photo_url?: string
}

/**
 * Get Telegram WebApp instance
 * @returns Telegram.WebApp object or null if not available
 */
export function getTelegramWebApp(): any | null {
  if (typeof window === 'undefined') {
    return null
  }
  return (window as any).Telegram?.WebApp ?? null
}

/**
 * Get Telegram user data from WebApp
 * @returns TelegramUser object or null if not available
 */
export function getTelegramUser(): TelegramUser | null {
  const wa = getTelegramWebApp()
  if (!wa) {
    return null
  }

  const tgUser = wa.initDataUnsafe?.user
  if (!tgUser) {
    return null
  }

  return {
    id: tgUser.id,
    username: tgUser.username,
    first_name: tgUser.first_name,
    last_name: tgUser.last_name,
    photo_url: tgUser.photo_url,
  }
}

/**
 * Initialize Telegram WebApp
 * Calls ready() and expand() if WebApp is available
 * @returns Object with hasWebApp flag, initDataLen, and user data
 */
export function initTelegramWebApp(): {
  hasWebApp: boolean
  initDataLen: number
  user: TelegramUser | null
} {
  const wa = getTelegramWebApp()
  
  if (!wa) {
    return {
      hasWebApp: false,
      initDataLen: 0,
      user: null,
    }
  }

  // Initialize Telegram WebApp
  try {
    wa.ready?.()
    wa.expand?.()
  } catch (error) {
    console.warn('Failed to initialize Telegram WebApp:', error)
  }

  const initDataLen = wa.initData?.length ?? 0
  const user = getTelegramUser()

  return {
    hasWebApp: true,
    initDataLen,
    user,
  }
}

