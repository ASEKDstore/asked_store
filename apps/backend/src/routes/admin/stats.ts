import { Router } from 'express'
import { readJson } from '../../store/jsonDb.js'
import type { Order } from '../../types/order.js'
import type { Promo } from '../../types/promo.js'

const router = Router()

// GET /api/admin/stats
router.get('/', async (req, res) => {
  try {
    const { from, to } = req.query
    
    const orders = await readJson<Order[]>('orders') || []
    const promos = await readJson<Promo[]>('promos') || []
    
    let filteredOrders = orders
    
    // Filter by date range
    if (from && typeof from === 'string') {
      const fromDate = new Date(from)
      filteredOrders = filteredOrders.filter(o => new Date(o.createdAt) >= fromDate)
    }
    
    if (to && typeof to === 'string') {
      const toDate = new Date(to)
      toDate.setHours(23, 59, 59, 999)
      filteredOrders = filteredOrders.filter(o => new Date(o.createdAt) <= toDate)
    }
    
    // Calculate stats
    const ordersCount = filteredOrders.length
    const revenue = filteredOrders.reduce((sum, o) => {
      const total = o.totalPrice - (o.discount || 0)
      return sum + total
    }, 0)
    const avgCheck = ordersCount > 0 ? revenue / ordersCount : 0
    
    // Status breakdown
    const statusBreakdown = {
      new: filteredOrders.filter(o => o.status === 'new').length,
      in_progress: filteredOrders.filter(o => o.status === 'in_progress').length,
      done: filteredOrders.filter(o => o.status === 'done').length,
      canceled: filteredOrders.filter(o => o.status === 'canceled').length,
    }
    
    // Top products
    const productMap = new Map<string, { productId: string; title: string; qty: number; revenue: number }>()
    
    filteredOrders.forEach(order => {
      order.items.forEach(item => {
        const existing = productMap.get(item.productId) || {
          productId: item.productId,
          title: item.title,
          qty: 0,
          revenue: 0,
        }
        existing.qty += item.qty
        existing.revenue += item.price * item.qty
        productMap.set(item.productId, existing)
      })
    })
    
    const topProducts = Array.from(productMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)
    
    // Promo usage
    const promoUsage = promos
      .filter(p => p.usedCount > 0)
      .map(p => ({
        code: p.code,
        usedCount: p.usedCount,
      }))
      .sort((a, b) => b.usedCount - a.usedCount)
    
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



