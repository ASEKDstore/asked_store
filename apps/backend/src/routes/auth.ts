import { Router, Request, Response, NextFunction } from 'express'
import { prisma } from '../db/prisma.js'

const router = Router()

// POST /api/auth/telegram
// Verifies Telegram WebApp initData and returns user info
router.post('/telegram', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { initData } = req.body

    if (!initData || typeof initData !== 'string') {
      return res.status(400).json({ error: 'initData is required' })
    }

    // Parse initData (format: key1=value1&key2=value2&...&hash=...)
    const params = new URLSearchParams(initData)
    const userParam = params.get('user')

    if (!userParam) {
      return res.status(400).json({ error: 'User data not found in initData' })
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

    // TODO: Verify hash using bot token (for production security)
    // For now, we trust the initData from Telegram WebApp

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

    // Return user data
    res.json({
      user: {
        id: userData.id,
        first_name: userData.first_name,
        last_name: userData.last_name,
        username: userData.username,
        photo_url: userData.photo_url,
      },
    })
  } catch (error: any) {
    console.error('Telegram auth error:', error)
    next(error)
  }
})

export default router

