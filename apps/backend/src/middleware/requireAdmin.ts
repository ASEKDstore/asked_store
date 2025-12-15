import { Request, Response, NextFunction } from 'express'
import { isAdmin } from '../store/adminsStore.js'

export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    const tgId = req.headers['x-tg-id']
    
    console.log('[requireAdmin] x-tg-id:', req.headers['x-tg-id'])
    
    if (!tgId) {
      return res.status(401).json({ message: 'Missing x-tg-id header' })
    }

    const tgIdNum = typeof tgId === 'string' ? parseInt(tgId, 10) : Number(tgId)
    
    if (isNaN(tgIdNum)) {
      return res.status(401).json({ message: 'Invalid x-tg-id' })
    }

    const admin = await isAdmin(tgIdNum)
    
    if (!admin) {
      return res.status(403).json({ message: 'Admin access required' })
    }

    // Attach tgId to request for use in routes
    ;(req as any).adminTgId = tgIdNum
    next()
  } catch (error) {
    console.error('requireAdmin error:', error)
    next(error)
  }
}

