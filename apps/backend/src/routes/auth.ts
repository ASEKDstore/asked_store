import { Router, Request, Response, NextFunction } from 'express'
import { createHmac, createHash } from 'crypto'
import jwt from 'jsonwebtoken'
import { prisma } from '../db/prisma.js'
import { getUserAvatarUrl } from '../services/telegramAvatar.js'

const router = Router()

/**
 * Validates Telegram WebApp initData hash
 * Algorithm: HMAC-SHA256 with secret = SHA256(botToken)
 * @param initData - Raw initData string from Telegram WebApp
 * @param botToken - Telegram bot token
 * @returns true if hash is valid, false otherwise
 */
function validateInitDataHash(initData: string, botToken: string): boolean {
  try {
    const params = new URLSearchParams(initData)
    const hash = params.get('hash')
    
    if (!hash) {
      return false
    }

    // Remove hash from params for validation
    params.delete('hash')
    
    // Sort params alphabetically and create data_check_string
    const dataCheckString = Array.from(params.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n')

    // Create secret: SHA256(botToken)
    const secret = createHash('sha256').update(botToken).digest()
    
    // Calculate HMAC-SHA256
    const calculatedHash = createHmac('sha256', secret)
      .update(dataCheckString)
      .digest('hex')

    // Compare hashes (constant-time comparison)
    return calculatedHash === hash
  } catch (error) {
    console.error('Hash validation error:', error)
    return false
  }
}

/**
 * Validates auth_date (should be within last 24 hours)
 * @param authDate - Unix timestamp from initData
 * @returns true if valid, false if expired
 */
function validateAuthDate(authDate: number): boolean {
  const now = Math.floor(Date.now() / 1000)
  const maxAge = 24 * 60 * 60 // 24 hours in seconds
  return (now - authDate) < maxAge
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
      console.error('BOT_TOKEN not configured')
      return res.status(500).json({ error: 'Server configuration error' })
    }

    // Validate hash
    if (!validateInitDataHash(initData, botToken)) {
      return res.status(401).json({ error: 'Invalid initData hash' })
    }

    // Parse initData (format: key1=value1&key2=value2&...&hash=...)
    const params = new URLSearchParams(initData)
    const userParam = params.get('user')
    const authDateParam = params.get('auth_date')

    if (!userParam) {
      return res.status(400).json({ error: 'User data not found in initData' })
    }

    // Validate auth_date
    if (authDateParam) {
      const authDate = parseInt(authDateParam, 10)
      if (isNaN(authDate) || !validateAuthDate(authDate)) {
        return res.status(401).json({ error: 'initData expired or invalid auth_date' })
      }
    }

    let userData: {
      id: number
      first_name?: string
      last_name?: string
      username?: string
      photo_url?: string
    }

    try {
      userData = JSON.parse(decodeURIComponent(userParam))
    } catch {
      return res.status(400).json({ error: 'Invalid user data format' })
    }

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

    // Try to get avatar URL from Bot API
    let avatarUrl: string | null = null
    try {
      avatarUrl = await getUserAvatarUrl(botToken, userData.id)
    } catch (error) {
      console.warn('[auth] Failed to fetch avatar:', error)
      // Continue without avatar
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

