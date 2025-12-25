/**
 * Shared types across applications
 */

export interface TelegramUser {
  id: number
  first_name?: string
  last_name?: string
  username?: string
  photo_url?: string
}

export interface JWTPayload {
  tgId: string
  role?: string
  iat?: number
  exp?: number
}
