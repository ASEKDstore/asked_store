import type { User } from '../../types/user'

/**
 * Normalizes Telegram user data to User type
 */
export function normalizeTelegramUser(tgUser: any): User {
  const id = Number(tgUser?.id)
  
  if (!id || !Number.isFinite(id)) {
    throw new Error('Invalid Telegram user: id is required and must be a number')
  }

  const first_name = tgUser?.first_name ?? ''
  const last_name = tgUser?.last_name ?? ''
  const username = tgUser?.username ?? undefined
  const photo_url = tgUser?.photo_url ?? undefined

  const firstName = first_name || undefined
  const lastName = last_name || undefined
  const photoUrl = photo_url || undefined

  // Get admin IDs from env
  const adminIds = (import.meta.env.VITE_ADMIN_TG_IDS ?? '')
    .split(',')
    .map((s: string) => Number(s.trim()))
    .filter((n: number) => Number.isFinite(n) && n > 0)

  const isAdmin = adminIds.includes(id)

  return {
    source: 'telegram',
    tgId: id,
    firstName,
    lastName,
    username,
    avatar: photoUrl,
    isAdmin,
  }
}

