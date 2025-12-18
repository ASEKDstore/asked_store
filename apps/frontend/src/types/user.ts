/**
 * Telegram user type (raw from Telegram WebApp)
 */
export type TgUser = {
  tgId: number
  first_name?: string
  last_name?: string
  username?: string
  photo_url?: string
  language_code?: string
  is_premium?: boolean
}

/**
 * Application User type
 * tgId is required (0 for guest)
 */
export type User = {
  source: 'telegram' | 'guest'
  tgId: number // Required: Telegram ID (0 for guest)
  firstName?: string
  lastName?: string
  username?: string
  avatar?: string
  isAdmin?: boolean
}

