import { createHmac, createHash } from 'crypto'

/**
 * Verifies Telegram WebApp initData according to official documentation
 * Algorithm: HMAC-SHA256 with secret = SHA256(botToken)
 * 
 * This implementation follows the exact algorithm from Telegram Mini Apps documentation:
 * 1. Parse initData as query string
 * 2. Extract hash
 * 3. Sort all other fields by key
 * 4. Create data_check_string: key=value\nkey=value (each pair on new line)
 * 5. Get secret_key = SHA256(bot_token)
 * 6. Calculate HMAC: computed_hash = HMAC_SHA256(secret_key, data_check_string).hex
 * 7. Compare computed_hash === hash
 * 8. Check auth_date (not older than 24 hours)
 * 
 * @param initData - Raw initData string from Telegram WebApp
 * @param botToken - Telegram bot token
 * @returns User object if valid, null otherwise
 */
export function verifyTelegramInitData(
  initData: string,
  botToken: string,
): {
  id: number
  first_name?: string
  last_name?: string
  username?: string
  photo_url?: string
} | null {
  try {
    // Parse initData as query string
    const params = new URLSearchParams(initData)
    const hash = params.get('hash')
    
    if (!hash) {
      return null
    }

    // Remove hash from params for validation
    params.delete('hash')

    // Sort params alphabetically and create data_check_string
    // Format: key=value\nkey=value (each pair on new line)
    const dataCheckString = Array.from(params.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n')

    // Get secret_key = SHA256(bot_token)
    const secretKey = createHash('sha256')
      .update(botToken)
      .digest()

    // Calculate HMAC: computed_hash = HMAC_SHA256(secret_key, data_check_string).hex
    const computedHash = createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex')

    // Compare computed_hash === hash
    if (computedHash !== hash) {
      console.log('[AUTH][TELEGRAM] Hash mismatch - invalid signature')
      return null
    }

    // Check auth_date (not older than 24 hours)
    const authDate = Number(params.get('auth_date'))
    if (!authDate) {
      console.log('[AUTH][TELEGRAM] Missing auth_date')
      return null
    }
    
    const authDateAge = Date.now() / 1000 - authDate
    if (authDateAge > 86400) {
      console.log('[AUTH][TELEGRAM] auth_date expired:', authDateAge, 'seconds old')
      return null
    }

    // Get and parse user data
    const userRaw = params.get('user')
    if (!userRaw) {
      console.log('[AUTH][TELEGRAM] Missing user data in initData')
      return null
    }

    // URLSearchParams already decodes values, so we parse directly
    // DO NOT use decodeURIComponent here - it's already decoded
    const userData = JSON.parse(userRaw)
    console.log('[AUTH][TELEGRAM] Verification OK - user data parsed')
    return userData
  } catch (error) {
    console.error('[AUTH][TELEGRAM] Verification error:', error)
    return null
  }
}

