import { Router } from 'express'
import { prisma } from '../prisma.js'
import { requireAuth } from '../middleware/requireAuth.js'

export const meRouter = Router()

// GET /me - Get current user (protected)
meRouter.get('/', requireAuth, async (req, res, next) => {
  try {
    const tgId = BigInt(req.user!.tgId)

    const user = await prisma.telegramUser.findUnique({
      where: { tgId },
    })

    if (!user) {
      return res.status(404).json({
        ok: false,
        error: 'User not found',
      })
    }

    res.json({
      ok: true,
      user: {
        id: user.id,
        tgId: String(user.tgId),
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      },
    })
  } catch (error: any) {
    next(error)
  }
})
