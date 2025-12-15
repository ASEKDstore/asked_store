import { Router } from 'express'
import { prisma } from '../../db/prisma.js'

const router = Router()

// GET /api/admin/stats
router.get('/', async (req, res) => {
  try {
    const { from, to } = req.query
    
    const where: any = {}
    
    // Filter by date range
    if (from && typeof from === 'string') {
      where.createdAt = { ...where.createdAt, gte: new Date(from) }
    }
    
    if (to && typeof to === 'string') {
      const toDate = new Date(to)
      toDate.setHours(23, 59, 59, 999)
      where.createdAt = { ...where.createdAt, lte: toDate }
    }
    
    const orders = await prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })
    
    // Calculate stats
    const ordersCount = orders.length
    const revenue = orders.reduce((sum, o) => sum + o.total, 0)
    const avgCheck = ordersCount > 0 ? revenue / ordersCount : 0
    
    // Status breakdown
    const statusBreakdown = {
      new: orders.filter(o => o.status === 'new').length,
      in_progress: orders.filter(o => o.status === 'in_progress').length,
      done: orders.filter(o => o.status === 'done').length,
      canceled: orders.filter(o => o.status === 'canceled').length,
    }
    
    // Top products
    const productMap = new Map<string, { productId: string; title: string; qty: number; revenue: number }>()
    
    orders.forEach(order => {
      const items = (order.items as any)?.items || []
      items.forEach((item: any) => {
        const productId = item.productId || item.labProductId || 'unknown'
        const existing = productMap.get(productId) || {
          productId,
          title: item.title || 'Unknown',
          qty: 0,
          revenue: 0,
        }
        existing.qty += item.qty || 0
        existing.revenue += (item.price || 0) * (item.qty || 0)
        productMap.set(productId, existing)
      })
    })
    
    const topProducts = Array.from(productMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)
    
    // Promo usage (simplified - promos don't track usage in current schema)
    const promos = await prisma.promo.findMany({
      where: { isActive: true },
    })
    
    const promoUsage = promos.map(p => ({
      code: p.code,
      usedCount: 0, // Would need to track this separately
    }))
    
    res.json({
      ordersCount,
      revenue,
      avgCheck: Math.round(avgCheck * 100) / 100,
      topProducts,
      statusBreakdown,
      promoUsage,
    })
  } catch (error: any) {
    console.error('Error fetching stats:', error)
    res.status(500).json({ error: 'Failed to fetch stats' })
  }
})

export default router
