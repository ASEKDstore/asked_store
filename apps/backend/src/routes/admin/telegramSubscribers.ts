import { Router, Request, Response, NextFunction } from 'express'
import { readJson, writeJson } from '../../store/jsonDb.js'

const router = Router()

export interface Subscriber {
  tgId: number
  enabled: boolean
  createdAt: string
  lastSentAt?: string
}

const SUBSCRIBERS_KEY = 'telegram_subscribers'

// GET /api/admin/telegram/subscribers
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const subscribers = await readJson<Subscriber[]>(SUBSCRIBERS_KEY, [])
    res.json(subscribers)
  } catch (error: any) {
    console.error('[TELEGRAM SUBSCRIBERS] Error fetching:', error)
    next(error)
  }
})

// POST /api/admin/telegram/subscribers/:tgId/toggle
router.post('/:tgId/toggle', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tgId = parseInt(req.params.tgId, 10)
    if (isNaN(tgId)) {
      return res.status(400).json({ error: 'Invalid tgId' })
    }

    const subscribers = await readJson<Subscriber[]>(SUBSCRIBERS_KEY, [])
    const index = subscribers.findIndex(s => s.tgId === tgId)

    if (index === -1) {
      return res.status(404).json({ message: 'Subscriber not found' })
    }

    subscribers[index].enabled = !subscribers[index].enabled
    await writeJson(SUBSCRIBERS_KEY, subscribers)

    res.json(subscribers[index])
  } catch (error: any) {
    console.error('[TELEGRAM SUBSCRIBERS] Error toggling:', error)
    next(error)
  }
})

// POST /api/admin/telegram/subscribers (add subscriber)
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tgId, enabled = true } = req.body

    if (!tgId || typeof tgId !== 'number') {
      return res.status(400).json({ error: 'tgId is required and must be a number' })
    }

    const subscribers = await readJson<Subscriber[]>(SUBSCRIBERS_KEY, [])
    const existing = subscribers.find(s => s.tgId === tgId)

    if (existing) {
      // Обновляем существующего
      existing.enabled = enabled !== false
      await writeJson(SUBSCRIBERS_KEY, subscribers)
      return res.json(existing)
    }

    // Создаём нового
    const newSubscriber: Subscriber = {
      tgId,
      enabled: enabled !== false,
      createdAt: new Date().toISOString(),
    }

    subscribers.push(newSubscriber)
    await writeJson(SUBSCRIBERS_KEY, subscribers)

    res.status(201).json(newSubscriber)
  } catch (error: any) {
    console.error('[TELEGRAM SUBSCRIBERS] Error adding:', error)
    next(error)
  }
})

export default router

