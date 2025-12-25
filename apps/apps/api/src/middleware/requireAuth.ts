import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { JWTPayload } from '@asked-store/shared'

declare global {
  namespace Express {
    interface Request {
      user?: {
        tgId: string
        role?: string
      }
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      ok: false,
      error: 'Missing or invalid authorization header',
    })
  }

  const token = authHeader.substring(7) // Remove 'Bearer ' prefix

  try {
    const jwtSecret = process.env.JWT_SECRET || process.env.TELEGRAM_BOT_TOKEN || process.env.BOT_TOKEN

    if (!jwtSecret) {
      throw new Error('JWT_SECRET or BOT_TOKEN not configured')
    }

    const decoded = jwt.verify(token, jwtSecret) as JWTPayload

    req.user = {
      tgId: decoded.tgId,
      role: decoded.role,
    }

    next()
  } catch (error: any) {
    return res.status(401).json({
      ok: false,
      error: 'Invalid or expired token',
    })
  }
}
