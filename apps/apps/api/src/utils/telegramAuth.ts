import { createHmac, timingSafeEqual } from 'crypto'

/**
 * Verifies Telegram WebApp initData according to official Telegram specification
 * 
 * Official algorithm (from Telegram Mini Apps documentation):
 * 1. Parse initData as query string using URLSearchParams
 * 2. Extract hash parameter
 * 3. Sort all other parameters by key (ASCII order)
 * 4. Create data_check_string: key=value\nkey=value (each pair on new line)
 * 5. Create secret_key: HMAC_SHA256("WebAppData", BOT_TOKEN)
 * 6. Calculate computed_hash: HMAC_SHA256(data_check_string, secret_key)
 * 7. Compare computed_hash === hash (using timing-safe comparison)
 * 8. Check auth_date (not older than 24 hours)
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
    // 1. Parse initData as query string
    const params = new URLSearchParams(initData)
    const hash = params.get('hash')

    if (!hash) {
      console.log('[AUTH][TELEGRAM] Missing hash parameter')
      return null
    }

    // 2. Remove hash from params for validation
    params.delete('hash')

    // 3. Sort params alphabetically (ASCII order) and create data_check_string
    const dataCheckString = Array.from(params.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n')

    // 4. Create secret_key: HMAC_SHA256("WebAppData", BOT_TOKEN)
    const secretKey = createHmac('sha256', 'WebAppData')
      .update(botToken)
      .digest()

    // 5. Calculate computed_hash: HMAC_SHA256(data_check_string, secret_key)
    const computedHash = createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex')

    // 6. Compare computed_hash === hash (timing-safe comparison)
    const hashBuffer = Buffer.from(hash, 'hex')
    const computedHashBuffer = Buffer.from(computedHash, 'hex')

    if (hashBuffer.length !== computedHashBuffer.length) {
      console.log('[AUTH][TELEGRAM] Hash length mismatch')
      return null
    }

    if (!timingSafeEqual(hashBuffer, computedHashBuffer)) {
      console.log('[AUTH][TELEGRAM] Hash mismatch - invalid signature')
      return null
    }

    // 7. Check auth_date (not older than 24 hours)
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

    // 8. Get and parse user data
    const userRaw = params.get('user')
    if (!userRaw) {
      console.log('[AUTH][TELEGRAM] Missing user data in initData')
      return null
    }

    const userData = JSON.parse(userRaw)
    console.log('[AUTH][TELEGRAM] Verification OK - user data parsed')
    return userData
  } catch (error) {
    console.error('[AUTH][TELEGRAM] Verification error:', error)
    return null
  }
}
