// Internal service-to-service authentication middleware

import { Request, Response, NextFunction } from 'express'

const INTERNAL_SERVICE_TOKEN = process.env.INTERNAL_SERVICE_TOKEN

/**
 * Middleware to authenticate internal service requests
 * Requires: Authorization: Bearer <INTERNAL_SERVICE_TOKEN>
 * 
 * Used for /internal/* endpoints to prevent external access
 */
export function internalAuth(req: Request, res: Response, next: NextFunction): void {
  if (!INTERNAL_SERVICE_TOKEN) {
    console.error('ERROR: INTERNAL_SERVICE_TOKEN not set. Internal auth is required.')
    res.status(500).json({ error: 'Internal service authentication not configured' })
    return
  }

  // Check Authorization header (Bearer token)
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: Missing or invalid authorization header' })
    return
  }

  const token = authHeader.substring(7)
  if (token !== INTERNAL_SERVICE_TOKEN) {
    res.status(403).json({ error: 'Forbidden: Invalid service token' })
    return
  }

  next()
}

