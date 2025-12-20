import { Router } from 'express'
import { prisma } from '../../db/prisma.js'

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
    
    const orders = await prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
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

export default router
