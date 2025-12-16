/**
 * Telegram WebApp utilities
 */

export type TgUser = {
  tgId: number
  firstName: string
  lastName?: string
  username?: string
  photoUrl?: string
}

/**
 * Get Telegram user data from WebApp
 * Returns null if Telegram WebApp is not available
 */
export function getTelegramUser(): TgUser | null {
  if (typeof window === 'undefined') {
    return null
  }

  const tg = window.Telegram?.WebApp
  const tgUser = tg?.initDataUnsafe?.user

  if (!tgUser) {
    return null
  }

  return {
    tgId: tgUser.id,
    firstName: tgUser.first_name || '',
    lastName: tgUser.last_name,
    username: tgUser.username,
    photoUrl: tgUser.photo_url,
  }
}

