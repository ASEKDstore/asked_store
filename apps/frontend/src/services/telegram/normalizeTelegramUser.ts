import type { User } from '../../context/UserContext'

/**
 * Normalizes Telegram user data to User type
 * Supports both old (id, first_name, photo_url) and new (tgId, firstName, photoUrl) field names
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

  const name = [first_name, last_name].filter(Boolean).join(' ').trim() || username || `id:${id}`

  // Get admin IDs from env
  const adminIds = (import.meta.env.VITE_ADMIN_TG_IDS ?? '')
    .split(',')
    .map((s: string) => Number(s.trim()))
    .filter((n: number) => Number.isFinite(n) && n > 0)

  const isAdmin = adminIds.includes(id)

  return {
    // Telegram raw fields (for old code compatibility)
    id,
    first_name: first_name || undefined,
    last_name: last_name || undefined,
    username,
    photo_url,

    // Normalized aliases (for new code)
    tgId: id,
    firstName,
    lastName,
    photoUrl,
    avatar: photoUrl,
    name,

    source: 'telegram',
    isAdmin,
  }
}

