import { Router } from 'express'
import jwt from 'jsonwebtoken'
import { prisma } from '../prisma.js'
import { verifyTelegramInitData } from '../utils/telegramAuth.js'
import { TelegramAuthRequestSchema } from '@asked-store/shared'

export const authRouter = Router()

// POST /auth/telegram
authRouter.post('/telegram', async (req, res, next) => {
  try {
    // Validate request body
    const validationResult = TelegramAuthRequestSchema.safeParse(req.body)
    if (!validationResult.success) {
      return res.status(400).json({
        ok: false,
        error: 'Invalid request',
        details: validationResult.error.errors,
      })
    }

    const { initData } = validationResult.data

    // Get bot token
    const botToken = process.env.TELEGRAM_BOT_TOKEN || process.env.BOT_TOKEN
    if (!botToken) {
      return res.status(500).json({
        ok: false,
        error: 'Server configuration error: BOT_TOKEN not set',
      })
    }

    // Verify initData
    const userData = verifyTelegramInitData(initData, botToken)
    if (!userData) {
      return res.status(401).json({
        ok: false,
        error: 'Invalid initData signature',
      })
    }

    // Upsert user in database
    const tgId = BigInt(userData.id)
    const user = await prisma.telegramUser.upsert({
      where: { tgId },
      update: {
        username: userData.username || null,
        firstName: userData.first_name || null,
        lastName: userData.last_name || null,
      },
      create: {
        tgId,
        username: userData.username || null,
        firstName: userData.first_name || null,
        lastName: userData.last_name || null,
      },
    })

    // Generate JWT
    const jwtSecret = process.env.JWT_SECRET || botToken
    const token = jwt.sign(
      {
        tgId: String(tgId),
        role: undefined, // Can be extended later
      },
      jwtSecret,
      {
        expiresIn: process.env.JWT_EXPIRES_IN || '30d',
      }
    )

    res.json({
      ok: true,
      token,
      user: {
        id: user.id,
        tgId: String(user.tgId),
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    })
  } catch (error: any) {
    next(error)
  }
})
