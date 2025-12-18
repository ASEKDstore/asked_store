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

