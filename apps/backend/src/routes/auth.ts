import { Router, Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { prisma } from '../db/prisma.js'
import { getUserAvatarUrl } from '../services/telegramAvatar.js'
import { verifyTelegramInitData } from '../utils/telegramAuth.js'

const router = Router()

// POST /api/auth/telegram
// Verifies Telegram WebApp initData and returns user info
router.post('/telegram', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { initData } = req.body

    if (!initData || typeof initData !== 'string') {
      return res.status(400).json({ error: 'initData is required' })
    }

    // Check required environment variables
    const missingEnv: string[] = []
    const botToken = process.env.BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN
    if (!botToken) {
      missingEnv.push('BOT_TOKEN or TELEGRAM_BOT_TOKEN')
    }

    // JWT_SECRET is optional (falls back to botToken), but log if missing
    const jwtSecret = process.env.JWT_SECRET || botToken
    if (!process.env.JWT_SECRET && botToken) {
      console.warn('[AUTH][CONFIG] JWT_SECRET not set, using BOT_TOKEN as fallback')
    }

    // Check database connection (Prisma will throw if not configured)
    // This is implicit - if DATABASE_URL is missing, Prisma will fail later

    if (missingEnv.length > 0) {
      const errorMsg = 'Server configuration error'
      console.error('[AUTH][CONFIG]', errorMsg, { missing: missingEnv })
      return res.status(500).json({ 
        error: errorMsg,
        missing: missingEnv 
      })
    }

    // Log initData length (not full content for security)
    console.log('[AUTH][TELEGRAM] initData length:', initData.length)

    // Verify initData using official Telegram algorithm
    const userData = verifyTelegramInitData(initData, botToken!)

    if (!userData) {
      console.log('[AUTH][TELEGRAM] Validation result: invalid')
      return res.status(401).json({ error: 'Invalid initData' })
    }

    // Log verified user (without sensitive data)
    console.log('[AUTH][TELEGRAM] Validation result: ok')
    console.log('[AUTH][TELEGRAM] User id:', userData.id)

    // Get avatar URL: prefer photo_url from initData, fallback to Bot API
    let avatarUrl: string | null = userData.photo_url || null
    if (!avatarUrl) {
      try {
        avatarUrl = await getUserAvatarUrl(botToken!, userData.id)
      } catch (error) {
        console.warn('[AUTH][TELEGRAM] Failed to fetch avatar:', error)
        // Continue without avatar
      }
    }

    // Ensure user exists in subscribers table and save avatar_url
    const tgIdBigInt = BigInt(userData.id)
    await prisma.telegramSubscriber.upsert({
      where: { tgId: tgIdBigInt },
      update: {
        username: userData.username,
        firstName: userData.first_name,
        lastName: userData.last_name,
        avatarUrl: avatarUrl,
        isActive: true,
      },
      create: {
        tgId: tgIdBigInt,
        username: userData.username,
        firstName: userData.first_name,
        lastName: userData.last_name,
        avatarUrl: avatarUrl,
        isActive: true,
      },
    })

    // Generate JWT token (7 days expiry)
    const token = jwt.sign(
      {
        sub: String(userData.id),
        userId: userData.id,
        telegram_id: userData.id,
      },
      jwtSecret,
      { expiresIn: '7d' }
    )

    console.log('[AUTH][TELEGRAM] Token generated successfully for user:', userData.id)

    // Return token and user data (keeping backward compatibility)
    res.json({
      ok: true,
      token,
      user: {
        id: userData.id,
        telegram_id: userData.id,
        username: userData.username || null,
        first_name: userData.first_name || null,
        last_name: userData.last_name || null,
        avatar_url: avatarUrl,
      },
    })
  } catch (error: any) {
    console.error('[AUTH][TELEGRAM] Error:', error)
    // Don't leak internal errors to client
    if (error instanceof Error) {
      console.error('[AUTH][TELEGRAM] Error details:', {
        message: error.message,
        stack: error.stack,
      })
    }
    next(error)
  }
})

export default router

