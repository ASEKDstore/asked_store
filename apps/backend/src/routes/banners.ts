import { Router, Request, Response, NextFunction } from 'express'
import { prisma } from '../db/prisma.js'

const router = Router()

// GET /api/banners - Public endpoint for active banners only
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const banners = await prisma.banner.findMany({
      where: {
        isActive: true,
      },
      orderBy: [
        { order: 'asc' },
        { createdAt: 'desc' },
      ],
    })
    res.json(banners)
  } catch (error: any) {
    next(error)
  }
})

export default router

