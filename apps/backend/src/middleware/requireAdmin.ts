import { Request, Response, NextFunction } from 'express'
import { prisma } from '../db/prisma.js'

/**
 * Get admin IDs from environment variable TELEGRAM_ADMIN_IDS
 * Supports format: "930749603" or "930749603,123456789"
 */
function getAdminIdsFromEnv(): number[] {
  const envValue = process.env.TELEGRAM_ADMIN_IDS || process.env.ROOT_ADMIN_ID || ''
  if (!envValue) {
    return []
  }
  
  return envValue
    .split(',')
    .map(s => s.trim())
    .map(s => Number(s))
    .filter(n => Number.isFinite(n) && n > 0)
}

export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    // Try to get userId from JWT token (if available)
    let userId: number | null = null
    
    // Check JWT token first (from Authorization header)
    const authHeader = req.headers.authorization
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const jwt = require('jsonwebtoken')
        const token = authHeader.substring(7)
        const jwtSecret = process.env.JWT_SECRET || process.env.BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN
        if (jwtSecret) {
          const decoded = jwt.verify(token, jwtSecret) as any
          if (decoded.telegram_id || decoded.userId) {
            userId = Number(decoded.telegram_id || decoded.userId)
          }
        }
      } catch (jwtError) {
        // JWT verification failed, continue to other methods
      }
    }
    
    // Fallback to x-tg-id header
    if (!userId) {
      const tgId = req.headers['x-tg-id']
      if (!tgId) {
        return res.status(401).json({ message: 'Missing authorization (JWT token or x-tg-id header)' })
      }
      
      try {
        userId = typeof tgId === 'string' ? Number(tgId) : Number(String(tgId))
        if (!Number.isFinite(userId) || userId <= 0) {
          return res.status(401).json({ message: 'Invalid x-tg-id format' })
        }
      } catch {
        return res.status(401).json({ message: 'Invalid x-tg-id format' })
      }
    }

    // Get admin IDs from environment
    const adminIds = getAdminIdsFromEnv()
    
    if (adminIds.length === 0) {
      console.warn('[requireAdmin] TELEGRAM_ADMIN_IDS not configured, denying access')
      return res.status(403).json({ message: 'Admin access required' })
    }

    // Check if userId is in admin list (string comparison)
    const userIdString = String(userId)
    const isAdmin = adminIds.some(adminId => String(adminId) === userIdString)
    
    if (!isAdmin) {
      console.log('[requireAdmin] Access denied', {
        userId: userIdString,
        adminIds: adminIds.map(String), // Log as strings, no token leakage
      })
      return res.status(403).json({ message: 'Admin access required' })
    }

    // Attach userId to request for use in routes
    ;(req as any).adminTgId = BigInt(userId)
    ;(req as any).adminUserId = userId
    
    console.log('[requireAdmin] Access granted', { userId: userIdString })
    next()
  } catch (error) {
    console.error('[requireAdmin] Error:', error)
    next(error)
  }
}

