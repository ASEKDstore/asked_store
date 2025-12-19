import { Request, Response, NextFunction } from 'express'
import { requireAuth } from './auth.js'

/**
 * Admin-only middleware
 * Requires authentication and admin role
 */
export function adminOnly(req: Request, res: Response, next: NextFunction) {
  // First check authentication
  requireAuth(req, res, (err?: any) => {
    if (err) {
      return next(err)
    }

    // Check if user is authenticated
    if (!req.user) {
      console.log('[ADMIN] No user in request (should not happen after requireAuth)')
      return res.status(401).json({ error: 'Missing authorization' })
    }

    // Check if user is admin
    if (req.user.role !== 'admin') {
      console.log('[ADMIN] Access denied', {
        tgId: req.user.tgId,
        role: req.user.role,
      })
      return res.status(403).json({ error: 'Admin access required' })
    }

    console.log('[ADMIN] Access granted', {
      tgId: req.user.tgId,
      role: req.user.role,
    })
    next()
  })
}

