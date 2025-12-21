import { Router } from 'express'
import { prisma } from '../../db/prisma.js'
import { adminOnly } from '../../middleware/adminOnly.js'

const router = Router()

// GET /api/admin/orders
router.get('/', async (req, res) => {
  try {
    const { status, q, from, to } = req.query
    
    const where: any = {}
    
    if (status && typeof status === 'string') {
      where.status = status
    }
    
    if (from && typeof from === 'string') {
      where.createdAt = { ...where.createdAt, gte: new Date(from) }
    }
    
    if (to && typeof to === 'string') {
      const toDate = new Date(to)
      toDate.setHours(23, 59, 59, 999)
      where.createdAt = { ...where.createdAt, lte: toDate }
    }
    
    // Admin panel: show ALL orders (no status filter by default, no soft-delete)
    // Only filter if status is explicitly provided
    const orders = await prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })
    
    console.log('[ADMIN/ORDERS] Fetch result:', {
      filterStatus: status || 'all',
      count: orders.length,
      recentIds: orders.slice(0, 5).map(o => ({ id: o.id, status: o.status, createdAt: o.createdAt })),
    })
    
    // Search filter (can be optimized with Prisma full-text search)
    let filtered = orders
    if (q && typeof q === 'string') {
      const query = q.toLowerCase()
      filtered = filtered.filter(o => {
        const orderData = o.items as any
        const user = orderData?.user || {}
        const delivery = orderData?.delivery || {}
        return (
          o.id.toLowerCase().includes(query) ||
          user.username?.toLowerCase().includes(query) ||
          user.name?.toLowerCase().includes(query) ||
          delivery.phone?.includes(query)
        )
      })
    }
    
    // Serialize orders - convert BigInt tgId to string and add totalPrice
    const serialized = filtered.map(o => {
      const orderData = o.items as any
      return {
        ...o,
        tgId: String(o.tgId), // Serialize BigInt to string
        items: orderData?.items || orderData || [],
        totalPrice: o.total, // Map total to totalPrice for frontend
        user: orderData?.user || {},
        delivery: orderData?.delivery || {},
        comment: orderData?.comment || null,
        promoCode: orderData?.promoCode || null,
        discount: orderData?.discount || null,
        createdAt: o.createdAt.toISOString(),
        updatedAt: o.updatedAt.toISOString(),
      }
    })
    
    res.json(serialized)
  } catch (error: any) {
    console.error('Error fetching admin orders:', error)
    res.status(500).json({ error: 'Failed to fetch orders' })
  }
})

// GET /api/admin/orders/:id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const order = await prisma.order.findUnique({
      where: { id },
    })
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' })
    }
    
    // Serialize order - convert BigInt tgId to string
    const orderData = order.items as any
    const serialized = {
      ...order,
      tgId: String(order.tgId), // Serialize BigInt to string
      items: orderData?.items || orderData || [],
      totalPrice: order.total, // Map total to totalPrice for frontend
      user: orderData?.user || {},
      delivery: orderData?.delivery || {},
      comment: orderData?.comment || null,
      promoCode: orderData?.promoCode || null,
      discount: orderData?.discount || null,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
    }
    
    res.json(serialized)
  } catch (error: any) {
    console.error('Error fetching order:', error)
    res.status(500).json({ error: 'Failed to fetch order' })
  }
})

// PATCH /api/admin/orders/:id
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { status } = req.body
    
    if (!status || !['new', 'in_progress', 'done', 'canceled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' })
    }
    
    const order = await prisma.order.update({
      where: { id },
      data: { status },
    })
    
    // Serialize order - convert BigInt tgId to string
    const orderData = order.items as any
    const serialized = {
      ...order,
      tgId: String(order.tgId), // Serialize BigInt to string
      items: orderData?.items || orderData || [],
      totalPrice: order.total, // Map total to totalPrice for frontend
      user: orderData?.user || {},
      delivery: orderData?.delivery || {},
      comment: orderData?.comment || null,
      promoCode: orderData?.promoCode || null,
      discount: orderData?.discount || null,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
    }
    
    res.json(serialized)
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Order not found' })
    }
    console.error('Error updating order:', error)
    res.status(500).json({ error: 'Failed to update order' })
  }
})

// GET /api/admin/orders/stats
router.get('/stats', adminOnly, async (req, res) => {
  try {
    // Total orders count
    const totalOrders = await prisma.order.count()

    // Total revenue (sum of all order totals)
    const revenueResult = await prisma.order.aggregate({
      _sum: {
        total: true,
      },
    })
    const revenue = revenueResult._sum.total || 0

    // Average order value
    const avgOrderValue = totalOrders > 0 ? Math.round(revenue / totalOrders) : 0

    // Orders by status
    const byStatus = await prisma.order.groupBy({
      by: ['status'],
      _count: {
        id: true,
      },
    })

    const statusMap: Record<string, number> = {
      new: 0,
      in_progress: 0,
      done: 0,
      canceled: 0,
    }
    byStatus.forEach(item => {
      statusMap[item.status] = item._count.id
    })

    // Last 7 days stats (optional)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    sevenDaysAgo.setHours(0, 0, 0, 0)

    const last7DaysOrders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: sevenDaysAgo,
        },
      },
      select: {
        createdAt: true,
        total: true,
      },
    })

    // Group by date
    const last7DaysMap: Record<string, { count: number; revenue: number }> = {}
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      date.setHours(0, 0, 0, 0)
      const dateKey = date.toISOString().split('T')[0]
      last7DaysMap[dateKey] = { count: 0, revenue: 0 }
    }

    last7DaysOrders.forEach(order => {
      const dateKey = order.createdAt.toISOString().split('T')[0]
      if (last7DaysMap[dateKey]) {
        last7DaysMap[dateKey].count++
        last7DaysMap[dateKey].revenue += order.total
      }
    })

    const last7Days = Object.entries(last7DaysMap).map(([date, data]) => ({
      date,
      count: data.count,
      revenue: data.revenue,
    }))

    res.json({
      totalOrders,
      revenue,
      avgOrderValue,
      byStatus: statusMap,
      last7Days,
    })
  } catch (error: any) {
    console.error('Error fetching order stats:', error)
    res.status(500).json({ error: 'Failed to fetch order stats' })
  }
})

// POST /api/admin/orders/clear
router.post('/clear', adminOnly, async (req, res) => {
  try {
    const { mode, before, confirm } = req.body

    if (confirm !== 'DELETE') {
      return res.status(400).json({ error: 'Must confirm with confirm: "DELETE"' })
    }

    if (!mode || !['all', 'beforeDate', 'testOnly'].includes(mode)) {
      return res.status(400).json({ error: 'Invalid mode. Must be: all, beforeDate, or testOnly' })
    }

    let where: any = {}

    if (mode === 'beforeDate') {
      if (!before) {
        return res.status(400).json({ error: 'before date is required for beforeDate mode' })
      }
      const beforeDate = new Date(before)
      if (isNaN(beforeDate.getTime())) {
        return res.status(400).json({ error: 'Invalid date format' })
      }
      where.createdAt = { lt: beforeDate }
    } else if (mode === 'testOnly') {
      // Delete orders with total <= 500 (test orders typically have low totals)
      where = { total: { lte: 500 } }
    }
    // mode === 'all' -> where = {} (delete all)

    const result = await prisma.order.deleteMany({ where })

    console.log('[ORDERS CLEAR]', { mode, before, deletedCount: result.count })

    res.json({
      success: true,
      deletedCount: result.count,
    })
  } catch (error: any) {
    console.error('Error clearing orders:', error)
    res.status(500).json({ error: 'Failed to clear orders' })
  }
})

export default router
