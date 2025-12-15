import { Router, Request, Response, NextFunction } from 'express'
import { prisma } from '../../db/prisma.js'

const router = Router()

// GET /api/admin/telegram/subscribers
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const subscribers = await prisma.telegramSubscriber.findMany({
      orderBy: { createdAt: 'desc' },
    })
    res.json(subscribers.map(s => ({
      tgId: s.tgId.toString(),
      username: s.username,
      firstName: s.firstName,
      lastName: s.lastName,
      isActive: s.isActive,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    })))
  } catch (error: any) {
    console.error('[TELEGRAM SUBSCRIBERS] Error fetching:', error)
    next(error)
  }
})

// POST /api/admin/telegram/subscribers/:tgId/toggle
router.post('/:tgId/toggle', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tgId = BigInt(req.params.tgId)
    
    const subscriber = await prisma.telegramSubscriber.findUnique({
      where: { tgId },
    })
    
    if (!subscriber) {
      return res.status(404).json({ message: 'Subscriber not found' })
    }
    
    const updated = await prisma.telegramSubscriber.update({
      where: { tgId },
      data: { isActive: !subscriber.isActive },
    })
    
    res.json({
      tgId: updated.tgId.toString(),
      username: updated.username,
      firstName: updated.firstName,
      lastName: updated.lastName,
      isActive: updated.isActive,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    })
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Subscriber not found' })
    }
    console.error('[TELEGRAM SUBSCRIBERS] Error toggling:', error)
    next(error)
  }
})

// POST /api/admin/telegram/subscribers
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tgId, username, firstName, lastName, isActive = true } = req.body
    
    if (!tgId) {
      return res.status(400).json({ error: 'tgId is required' })
    }
    
    const tgIdBigInt = typeof tgId === 'string' ? BigInt(tgId) : BigInt(Number(tgId))
    
    const subscriber = await prisma.telegramSubscriber.upsert({
      where: { tgId: tgIdBigInt },
      update: {
        username,
        firstName,
        lastName,
        isActive: isActive !== false,
      },
      create: {
        tgId: tgIdBigInt,
        username,
        firstName,
        lastName,
        isActive: isActive !== false,
      },
    })
    
    res.status(201).json({
      tgId: subscriber.tgId.toString(),
      username: subscriber.username,
      firstName: subscriber.firstName,
      lastName: subscriber.lastName,
      isActive: subscriber.isActive,
      createdAt: subscriber.createdAt,
      updatedAt: subscriber.updatedAt,
    })
  } catch (error: any) {
    console.error('[TELEGRAM SUBSCRIBERS] Error adding:', error)
    next(error)
  }
})

export default router
