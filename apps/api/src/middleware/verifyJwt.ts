// JWT verification middleware

import { Request, Response, NextFunction } from 'express'
import { verifyToken } from '../utils/jwt.js'
import type { JWTPayload } from '@asked-store/shared'

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload
    }
  }
}

/**
 * Middleware to verify JWT token
 * Validates JWT token from Authorization header and attaches user payload to request
 */
export function verifyJwt(req: Request, res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Unauthorized: Missing or invalid authorization header' })
      return
    }

    const token = authHeader.substring(7)
    const payload = verifyToken(token)
    req.user = payload
    next()
  } catch (error) {
    res.status(401).json({ error: 'Unauthorized: Invalid or expired token' })
  }
}

