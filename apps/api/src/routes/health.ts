// Health check endpoint

import { Router, Request, Response } from 'express'

const router = Router()

/**
 * GET /health
 * Health check endpoint (should work even if DB is unavailable)
 */
router.get('/', (req: Request, res: Response) => {
  res.json({ status: 'ok' })
})

export { router as healthRouter }

