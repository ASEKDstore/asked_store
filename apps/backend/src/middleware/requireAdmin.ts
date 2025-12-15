import { Request, Response, NextFunction } from 'express'
import { prisma } from '../db/prisma.js'

export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    const tgId = req.headers['x-tg-id']
    
    if (!tgId) {
      return res.status(401).json({ message: 'Missing x-tg-id header' })
    }

    // Convert to BigInt for database
    let tgIdBigInt: bigint
    try {
      tgIdBigInt = typeof tgId === 'string' ? BigInt(tgId) : BigInt(String(tgId))
    } catch {
      return res.status(401).json({ message: 'Invalid x-tg-id format' })
    }

    const admin = await prisma.admin.findUnique({
      where: { tgId: tgIdBigInt },
    })
    
    if (!admin) {
      return res.status(403).json({ message: 'Admin access required' })
    }

    // Attach tgId to request for use in routes
    ;(req as any).adminTgId = tgIdBigInt
    next()
  } catch (error) {
    console.error('requireAdmin error:', error)
    next(error)
  }
}

