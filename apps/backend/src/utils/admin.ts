/**
 * Admin utilities
 */

/**
 * Get admin IDs from environment variable TELEGRAM_ADMIN_IDS
 * Format: "930749603" or "930749603,123456789"
 */
export function getAdminIdsFromEnv(): number[] {
  const envValue = process.env.TELEGRAM_ADMIN_IDS || process.env.ROOT_ADMIN_ID || ''
  if (!envValue) {
    return []
  }
  
  return envValue
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
    .map(s => Number(s))
    .filter(n => Number.isFinite(n) && n > 0)
}

/**
 * Check if Telegram user ID is admin
 * @param userId - Telegram user ID (number or string)
 * @returns true if user is admin
 */
export function isAdminTelegramId(userId: number | string): boolean {
  const adminIds = getAdminIdsFromEnv()
  if (adminIds.length === 0) {
    return false
  }
  
  const userIdString = String(userId)
  return adminIds.some(adminId => String(adminId) === userIdString)
}

