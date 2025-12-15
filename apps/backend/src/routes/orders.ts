import { Router } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { prisma } from '../db/prisma.js'
import { notifyAdminsAboutOrder } from '../services/telegramNotify.js'
import type { CreateOrderRequest, OrderStatus } from '../types/order.js'

const router = Router()

// POST /api/orders - Create order
router.post('/', async (req, res) => {
  try {
    const data: CreateOrderRequest = req.body

    // Validate required fields
    if (!data.user?.tgId || !data.items?.length || !data.delivery) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    // Calculate total price
    let totalPrice = data.items.reduce((sum: number, item: any) => sum + item.price * item.qty, 0)
    let discount = 0
    let promoCode = data.promoCode

    // Apply promo if provided
    if (promoCode) {
      const promo = await prisma.promo.findUnique({
        where: { code: promoCode.toUpperCase() },
      })
      
      if (promo && promo.isActive) {
        discount = Math.round((totalPrice * promo.discountPercent) / 100)
        // Note: In production, you might want to track promo usage
      } else {
        promoCode = undefined
      }
    }

    totalPrice = Math.max(0, totalPrice - discount)

    // Convert OrderItem[] to JSON-safe plain objects
    const itemsJson = data.items.map(item => ({
      productId: item.productId ?? null,
      labProductId: item.labProductId ?? null,
      type: item.type ?? null,
      title: item.title,
      article: item.article,
      price: item.price,
      qty: item.qty,
      size: item.size ?? null,
      artistName: item.artistName ?? null,
    }))

    // Create JSON-safe order data
    const orderDataJson = {
      user: {
        tgId: data.user.tgId,
        name: data.user.name,
        username: data.user.username ?? null,
        photo_url: data.user.photo_url ?? null,
      },
      items: itemsJson,
      delivery: {
        fullName: data.delivery.fullName,
        phone: data.delivery.phone,
        address: data.delivery.address,
        method: data.delivery.method,
      },
      comment: data.comment ?? null,
      promoCode: promoCode ?? null,
      discount: discount > 0 ? discount : null,
    }

    // Create order
    const tgIdBigInt = BigInt(data.user.tgId)
    const order = await prisma.order.create({
      data: {
        id: uuidv4(),
        items: orderDataJson as any,
        total: totalPrice,
        status: 'new',
        tgId: tgIdBigInt,
      },
    })

    // Notify admins
    try {
      const orderForNotification = {
        ...order,
        items: order.items as any,
        createdAt: order.createdAt.toISOString(),
        updatedAt: order.updatedAt.toISOString(),
      }
      await notifyAdminsAboutOrder(orderForNotification as any)
    } catch (error) {
      console.error('Failed to notify admins:', error)
      // Don't fail the request if notification fails
    }

    res.status(201).json({
      ...order,
      items: order.items as any,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
    })
  } catch (error: any) {
    console.error('Error creating order:', error)
    res.status(500).json({ error: 'Failed to create order' })
  }
})

// GET /api/orders?tgId=... - Get orders by Telegram ID
router.get('/', async (req, res) => {
  try {
    const tgId = req.query.tgId ? BigInt(String(req.query.tgId)) : null

    if (!tgId) {
      return res.status(400).json({ error: 'tgId is required' })
    }

    const orders = await prisma.order.findMany({
      where: { tgId },
      orderBy: { createdAt: 'desc' },
    })
    
    res.json(orders.map(o => ({
      ...o,
      items: o.items as any,
      createdAt: o.createdAt.toISOString(),
      updatedAt: o.updatedAt.toISOString(),
    })))
  } catch (error: any) {
    console.error('Error fetching orders:', error)
    res.status(500).json({ error: 'Failed to fetch orders' })
  }
})

// PATCH /api/orders/:id - Update order status
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

    res.json({
      ...order,
      items: order.items as any,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
    })
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Order not found' })
    }
    console.error('Error updating order:', error)
    res.status(500).json({ error: 'Failed to update order' })
  }
})

export default router
