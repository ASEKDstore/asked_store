import { Router, Request, Response, NextFunction } from 'express'
import { createHmac, createHash } from 'crypto'
import jwt from 'jsonwebtoken'
import { prisma } from '../db/prisma.js'
import { getUserAvatarUrl } from '../services/telegramAvatar.js'

const router = Router()

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
function verifyTelegramInitData(
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
      return null
    }

    // Check auth_date (not older than 24 hours)
    const authDate = Number(params.get('auth_date'))
    if (!authDate || Date.now() / 1000 - authDate > 86400) {
      return null
    }

    // Get and parse user data
    const userRaw = params.get('user')
    if (!userRaw) {
      return null
    }

    // URLSearchParams already decodes values, so we parse directly
    // DO NOT use decodeURIComponent here - it's already decoded
    return JSON.parse(userRaw)
  } catch (error) {
    console.error('[TG AUTH] Verification error:', error)
    return null
  }
}

// POST /api/auth/telegram
// Verifies Telegram WebApp initData and returns user info
router.post('/telegram', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { initData } = req.body

    if (!initData || typeof initData !== 'string') {
      return res.status(400).json({ error: 'initData is required' })
    }

    // Get bot token from env
    const botToken = process.env.BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN
    if (!botToken) {
      console.error('[TG AUTH] BOT_TOKEN not configured')
      return res.status(500).json({ error: 'Server configuration error' })
    }

    // Log initData for debugging (temporarily)
    console.log('[TG AUTH] initData:', initData)

    // Verify initData using official Telegram algorithm
    const userData = verifyTelegramInitData(initData, botToken)

    if (!userData) {
      console.log('[TG AUTH] Verification failed')
      return res.status(401).json({ error: 'Invalid Telegram data' })
    }

    // Log verified user for debugging
    console.log('[TG AUTH] verified user:', userData)

    // Ensure user exists in subscribers table
    const tgIdBigInt = BigInt(userData.id)
    await prisma.telegramSubscriber.upsert({
      where: { tgId: tgIdBigInt },
      update: {
        username: userData.username,
        firstName: userData.first_name,
        lastName: userData.last_name,
        isActive: true,
      },
      create: {
        tgId: tgIdBigInt,
        username: userData.username,
        firstName: userData.first_name,
        lastName: userData.last_name,
        isActive: true,
      },
    })

    // Get avatar URL: prefer photo_url from initData, fallback to Bot API
    let avatarUrl: string | null = userData.photo_url || null
    if (!avatarUrl) {
      try {
        avatarUrl = await getUserAvatarUrl(botToken, userData.id)
      } catch (error) {
        console.warn('[TG AUTH] Failed to fetch avatar:', error)
        // Continue without avatar
      }
    }

    // Generate JWT token (7 days expiry)
    const jwtSecret = process.env.JWT_SECRET || botToken // Fallback to botToken if JWT_SECRET not set
    const token = jwt.sign(
      {
        sub: String(userData.id),
        userId: userData.id,
        telegram_id: userData.id,
      },
      jwtSecret,
      { expiresIn: '7d' }
    )

    // Return token and user data
    res.json({
      token,
      user: {
        telegram_id: userData.id,
        username: userData.username || null,
        first_name: userData.first_name || null,
        last_name: userData.last_name || null,
        avatar_url: avatarUrl,
      },
    })
  } catch (error: any) {
    console.error('Telegram auth error:', error)
    next(error)
  }
})

export default router

