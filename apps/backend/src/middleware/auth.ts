import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

/**
 * Extended Request type with user info
 */
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: number
        tgId: number
        role: 'admin' | 'user'
      }
    }
  }
}

/**
 * Authentication middleware
 * Verifies JWT token and attaches user info to req.user
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('[AUTH] Missing authorization header')
      return res.status(401).json({ error: 'Missing authorization' })
    }

    const token = authHeader.substring(7)
    const jwtSecret = process.env.JWT_SECRET || process.env.BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN

    if (!jwtSecret) {
      console.error('[AUTH] JWT_SECRET not configured')
      return res.status(500).json({ error: 'Server configuration error' })
    }

    try {
      const decoded = jwt.verify(token, jwtSecret) as any
      
      const userId = decoded.userId || decoded.telegram_id || decoded.sub
      const tgId = decoded.tgId || decoded.telegram_id || userId
      const role = decoded.role || 'user'

      if (!userId) {
        console.warn('[AUTH] Token missing userId')
        return res.status(401).json({ error: 'Invalid token' })
      }

      // Attach user info to request
      req.user = {
        userId: Number(userId),
        tgId: Number(tgId),
        role: role === 'admin' ? 'admin' : 'user',
      }

      console.log('[AUTH] User authenticated', { tgId: req.user.tgId, role: req.user.role })
      next()
    } catch (jwtError: any) {
      if (jwtError.name === 'TokenExpiredError') {
        console.log('[AUTH] Token expired')
        return res.status(401).json({ error: 'Invalid or expired token' })
      }
      if (jwtError.name === 'JsonWebTokenError') {
        console.log('[AUTH] Invalid token:', jwtError.message)
        return res.status(401).json({ error: 'Invalid or expired token' })
      }
      console.error('[AUTH] JWT verification error:', jwtError)
      return res.status(401).json({ error: 'Invalid or expired token' })
    }
  } catch (error) {
    console.error('[AUTH] Auth middleware error:', error)
    next(error)
  }
}

