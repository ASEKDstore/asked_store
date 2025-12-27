// Telegram authentication endpoint

import { Router, Request, Response } from 'express'
import { telegramAuthRequestSchema } from '@asked-store/shared'
import { validateTelegramInitData, parseInitData } from '../utils/telegramAuth.js'
import { generateToken } from '../utils/jwt.js'
import { prisma } from '../prisma.js'
import { errorHandler } from '../middleware/errorHandler.js'

const router = Router()

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
if (!TELEGRAM_BOT_TOKEN) {
  throw new Error('TELEGRAM_BOT_TOKEN environment variable is required')
}

/**
 * POST /auth/telegram
 * Authenticate user via Telegram WebApp initData
 */
router.post('/telegram', async (req: Request, res: Response) => {
  try {
    // Validate request body
    const validationResult = telegramAuthRequestSchema.safeParse(req.body)
    if (!validationResult.success) {
      res.status(400).json({
        error: 'Invalid request',
        details: validationResult.error.errors,
      })
      return
    }

    const { initData } = validationResult.data

    // Validate Telegram signature
    if (!validateTelegramInitData(initData, TELEGRAM_BOT_TOKEN)) {
      res.status(401).json({ error: 'Invalid Telegram signature' })
      return
    }

    // Parse initData
    const parsedData = parseInitData(initData)
    if (!parsedData.user) {
      res.status(400).json({ error: 'User data not found in initData' })
      return
    }

    const { id: tgId, first_name: firstName, last_name: lastName, username, photo_url: photoUrl } = parsedData.user

    // Upsert user in database
    const user = await prisma.user.upsert({
      where: { tgId: BigInt(tgId) },
      update: {
        username: username || null,
        firstName: firstName || null,
        lastName: lastName || null,
        photoUrl: photoUrl || null,
        updatedAt: new Date(),
      },
      create: {
        tgId: BigInt(tgId),
        username: username || null,
        firstName: firstName || null,
        lastName: lastName || null,
        photoUrl: photoUrl || null,
      },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    })

    // Get user roles
    const roles = user.userRoles.map((ur) => ur.role.name)

    // Generate JWT token with sub=userId, telegramId, roles[]
    const token = generateToken({
      sub: user.id, // User ID as subject
      tgId: user.tgId.toString(),
      roles: roles,
    })

    // Return token and user profile
    res.json({
      token,
      user: {
        id: user.id,
        tgId: user.tgId.toString(),
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        photoUrl: user.photoUrl,
        roles: roles,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    })
  } catch (error) {
    errorHandler(error as Error, req, res, () => {})
  }
})

export { router as authRouter }

