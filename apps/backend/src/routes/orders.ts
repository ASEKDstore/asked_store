import { Router } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { saveOrder, getOrdersByTgId, updateOrderStatus } from '../services/orderStorage.js'
import { notifyAdminsAboutOrder } from '../services/telegramNotify.js'
import { readJson, writeJson } from '../store/jsonDb.js'
import type { CreateOrderRequest, OrderStatus } from '../types/order.js'
import type { Promo } from '../types/promo.js'

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
    let totalPrice = data.items.reduce((sum, item) => sum + item.price * item.qty, 0)
    let discount = 0
    let promoCode = data.promoCode

    // Apply promo if provided
    if (promoCode) {
      const promos = await readJson<Promo[]>('promos') || []
      const promo = promos.find(p => p.code.toUpperCase() === promoCode.toUpperCase())
      
      if (promo && promo.active) {
        const isExpired = promo.expiresAt && new Date(promo.expiresAt) < new Date()
        const isLimitReached = promo.usageLimit !== null && promo.usedCount >= promo.usageLimit
        
        if (!isExpired && !isLimitReached) {
          if (promo.type === 'percent') {
            discount = Math.round((totalPrice * promo.value) / 100)
          } else {
            discount = promo.value
          }
          
          // Update promo usedCount
          promo.usedCount++
          await writeJson('promos', promos)
        } else {
          promoCode = undefined
        }
      } else {
        promoCode = undefined
      }
    }

    totalPrice = Math.max(0, totalPrice - discount)

    // Create order
    const order = {
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      user: data.user,
      items: data.items,
      totalPrice,
      status: 'new' as OrderStatus,
      delivery: data.delivery,
      comment: data.comment,
      promoCode,
      discount: discount > 0 ? discount : undefined,
    }

    // Save order
    const savedOrder = await saveOrder(order)

    // Notify admins
    try {
      await notifyAdminsAboutOrder(savedOrder)
    } catch (error) {
      console.error('Failed to notify admins:', error)
      // Don't fail the request if notification fails
    }

    res.status(201).json(savedOrder)
  } catch (error: any) {
    console.error('Error creating order:', error)
    res.status(500).json({ error: 'Failed to create order' })
  }
})

// GET /api/orders?tgId=... - Get orders by Telegram ID
router.get('/', async (req, res) => {
  try {
    const tgId = req.query.tgId ? parseInt(req.query.tgId as string, 10) : null

    if (!tgId || isNaN(tgId)) {
      return res.status(400).json({ error: 'tgId is required' })
    }

    const orders = await getOrdersByTgId(tgId)
    res.json(orders)
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

    const order = await updateOrderStatus(id, status as OrderStatus)

    if (!order) {
      return res.status(404).json({ error: 'Order not found' })
    }

    res.json(order)
  } catch (error: any) {
    console.error('Error updating order:', error)
    res.status(500).json({ error: 'Failed to update order' })
  }
})

export default router

