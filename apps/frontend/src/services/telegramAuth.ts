import type { User } from '../types/user'
import { normalizeTelegramUser } from './telegram/normalizeTelegramUser'
import { apiUrl } from '../utils/api'

/**
 * Real Telegram WebApp login function
 * Uses Telegram WebApp initData for authentication
 * 
 * Flow:
 * 1. Get initData from Telegram WebApp
 * 2. Send initData to backend /api/auth/telegram
 * 3. Backend validates initData and returns JWT + user data
 * 4. Return normalized user data
 */
export async function loginWithTelegram(): Promise<User> {
  const tg = window.Telegram?.WebApp

  if (!tg || !tg.initData) {
    throw new Error('Telegram WebApp not available or initData missing')
  }

  // Initialize WebApp
  tg.ready?.()
  tg.expand?.()

  // Get initData
  const initData = tg.initData

  // Send initData to backend for validation
  const response = await fetch(apiUrl('/api/auth/telegram'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ initData }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Authentication failed' }))
    throw new Error(errorData.error || 'Не удалось авторизоваться. Перезапусти через /start.')
  }

  const data = await response.json()
  const { user } = data

  // Return normalized user data
  return normalizeTelegramUser({
    id: user.telegram_id,
    first_name: user.first_name,
    last_name: user.last_name,
    username: user.username,
    photo_url: user.avatar_url,
  })
}




