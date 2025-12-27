// Telegram authentication endpoint

import { Router, Request, Response } from 'express'
import { telegramAuthRequestSchema, type AuthResponseDTO, type UserDTO } from '@asked-store/shared'
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
    const tgIdBigInt = BigInt(tgId)

    // Check if this is the owner (first login only)
    const TELEGRAM_OWNER_ID = process.env.TELEGRAM_OWNER_ID
    const isOwner = TELEGRAM_OWNER_ID && BigInt(TELEGRAM_OWNER_ID) === tgIdBigInt

    // Upsert user in database
    const user = await prisma.user.upsert({
      where: { tgId: tgIdBigInt },
      update: {
        username: username || null,
        firstName: firstName || null,
        lastName: lastName || null,
        photoUrl: photoUrl || null,
        updatedAt: new Date(),
      },
      create: {
        tgId: tgIdBigInt,
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

    // Assign owner role if this is the owner and they don't have it yet
    if (isOwner) {
      const ownerRole = await prisma.role.findUnique({ where: { name: 'owner' } })
      if (ownerRole) {
        const hasOwnerRole = user.userRoles.some((ur) => ur.role.name === 'owner')
        if (!hasOwnerRole) {
          await prisma.userRole.create({
            data: {
              userId: user.id,
              roleId: ownerRole.id,
            },
          })
          console.log(`✅ Assigned owner role to user ${user.id} (tgId: ${tgId})`)
        }
      }
    }

    // Get user roles (refresh to include newly assigned owner role if applicable)
    const userWithRoles = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    })

    const roles = userWithRoles?.userRoles.map((ur) => ur.role.name) || user.userRoles.map((ur) => ur.role.name)

    // Generate JWT token with sub=userId, telegramId, roles[]
    const token = generateToken({
      sub: user.id, // User ID as subject
      tgId: user.tgId.toString(),
      roles: roles,
    })

    // Return token and user profile (use userWithRoles if available, otherwise user)
    const finalUser = userWithRoles || user
    
    // Build UserDTO
    const userDTO: UserDTO = {
      id: finalUser.id,
      tgId: finalUser.tgId.toString(),
      username: finalUser.username,
      firstName: finalUser.firstName,
      lastName: finalUser.lastName,
      photoUrl: finalUser.photoUrl,
      roles: roles,
      createdAt: finalUser.createdAt.toISOString(),
      updatedAt: finalUser.updatedAt.toISOString(),
    }

    // Build AuthResponseDTO
    const authResponse: AuthResponseDTO = {
      token,
      user: userDTO,
    }

    res.json(authResponse)
  } catch (error) {
    errorHandler(error as Error, req, res, () => {})
  }
})

export { router as authRouter }

