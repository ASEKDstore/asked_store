// Ready check endpoint (database connection)

import { Router, Request, Response } from 'express'
import { prisma } from '../prisma.js'

const router = Router()

/**
 * GET /ready
 * Readiness check endpoint - returns 200 only if DB connection is available
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    // Simple DB connection check: SELECT 1
    await prisma.$queryRaw`SELECT 1`
    res.json({ status: 'ok' })
  } catch (error) {
    console.error('Database connection check failed:', error)
    res.status(503).json({ status: 'error', message: 'Database unavailable' })
  }
})

export { router as readyRouter }

