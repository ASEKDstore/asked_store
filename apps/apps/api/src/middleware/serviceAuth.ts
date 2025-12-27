// Service authentication middleware (for internal/bot endpoints)

import { Request, Response, NextFunction } from 'express'

const SERVICE_TOKEN = process.env.SERVICE_TOKEN || process.env.BOT_SERVICE_TOKEN
const SERVICE_SECRET = process.env.SERVICE_SECRET || process.env.BOT_SERVICE_SECRET

/**
 * Middleware to authenticate service requests
 * Supports two methods:
 * 1. Service token (Bearer token in Authorization header)
 * 2. Shared secret (X-Service-Secret header)
 */
export function serviceAuth(req: Request, res: Response, next: NextFunction): void {
  if (!SERVICE_TOKEN && !SERVICE_SECRET) {
    console.warn('WARNING: SERVICE_TOKEN or SERVICE_SECRET not set. Service auth disabled.')
    next()
    return
  }

  // Check Authorization header (Bearer token)
  const authHeader = req.headers.authorization
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7)
    if (SERVICE_TOKEN && token === SERVICE_TOKEN) {
      next()
      return
    }
  }

  // Check X-Service-Secret header
  const secret = req.headers['x-service-secret'] as string | undefined
  if (SERVICE_SECRET && secret === SERVICE_SECRET) {
    next()
    return
  }

  res.status(401).json({ error: 'Unauthorized: Invalid service credentials' })
}

