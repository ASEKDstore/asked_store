import { Router } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { prisma } from '../db/prisma.js'
import { notifyAdminsAboutOrder } from '../services/telegramNotify.js'
import { notifyUserAboutOrder, needsUserStart } from '../services/botClient.js'
import type { CreateOrderRequest, OrderStatus } from '../types/order.js'

const router = Router()

/**
 * Normalize order for API response
 * Extracts itemsList from items JSON payload and serializes BigInt
 */
function normalizeOrder(order: any) {
  const payload = order.items as any
  
  // Extract items array from payload
  const itemsList = Array.isArray(payload?.items) ? payload.items : []
  
  return {
    ...order,
    tgId: String(order.tgId), // Serialize BigInt to string
    items: payload, // Keep full payload for backward compatibility
    itemsList, // Add extracted items array
    user: payload?.user || {},
    delivery: payload?.delivery || {},
    comment: payload?.comment || null,
    promoCode: payload?.promoCode || null,
    discount: payload?.discount || null,
    totalPrice: order.total, // Map total to totalPrice
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
  }
}

// POST /api/orders - Create order
router.post('/', async (req, res) => {
  try {
    const data: CreateOrderRequest = req.body

    // Debug log (limited, no personal data)
    console.debug('[POST /api/orders] Received order request:', {
      hasUser: !!data.user,
      hasTgId: !!data.user?.tgId,
      itemsCount: data.items?.length || 0,
      hasDelivery: !!data.delivery,
      hasPromoCode: !!data.promoCode,
    })

    // Validate required fields - tgId
    if (!data.user?.tgId) {
      return res.status(400).json({ error: 'tgId is required' })
    }

    // Validate and parse tgId
    const tgIdRaw = String(data.user.tgId).trim()
    let tgIdBigInt: bigint
    try {
      tgIdBigInt = BigInt(tgIdRaw)
    } catch (error) {
      console.error('[POST /api/orders] Invalid tgId:', tgIdRaw, error)
      return res.status(400).json({ error: 'Invalid tgId' })
    }

    // Validate required fields - items must be array with length > 0
    if (!Array.isArray(data.items) || data.items.length === 0) {
      return res.status(400).json({ error: 'Items must be a non-empty array' })
    }

    // Validate delivery
    if (!data.delivery) {
      return res.status(400).json({ error: 'Delivery is required' })
    }

    // Normalize and validate items
    const normalizedItems = data.items.map((item: any, index: number) => {
      // Validate price - must be finite number > 0
      const price = Number(item.price)
      if (!Number.isFinite(price) || price <= 0) {
        throw { statusCode: 400, message: `Item ${index + 1}: invalid price (must be a positive number)` }
      }

      // Validate qty - must be integer > 0
      const qty = Number(item.qty)
      if (!Number.isInteger(qty) || qty <= 0) {
        throw { statusCode: 400, message: `Item ${index + 1}: invalid quantity (must be a positive integer)` }
      }

      return {
        ...item,
        price,
        qty,
      }
    })

    // Calculate total price using normalized items
    let totalPrice = normalizedItems.reduce((sum: number, item: any) => sum + item.price * item.qty, 0)
    
    // Ensure totalPrice is a valid integer
    if (!Number.isFinite(totalPrice) || totalPrice < 0) {
      return res.status(400).json({ error: 'Invalid total price calculated' })
    }
    
    totalPrice = Math.round(totalPrice)
    
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
    totalPrice = Math.round(totalPrice) // Ensure integer

    // Final validation: totalPrice must be finite positive integer
    if (!Number.isFinite(totalPrice) || totalPrice < 0 || !Number.isInteger(totalPrice)) {
      console.error('[POST /api/orders] Invalid totalPrice after calculation:', totalPrice)
      return res.status(400).json({ error: 'Invalid total price calculated' })
    }

    // Convert normalized items to JSON-safe plain objects
    // Guarantee all required fields exist
    const itemsJson = normalizedItems.map(item => {
      // Validate required fields
      if (!item.title || typeof item.title !== 'string') {
        throw { statusCode: 400, message: 'Item title is required' }
      }

      return {
        productId: item.productId ?? null,
        labProductId: item.labProductId ?? null,
        type: item.type ?? null,
        title: String(item.title),
        article: item.article ?? null,
        price: Number(item.price), // Already normalized, but ensure number
        qty: Number(item.qty), // Already normalized, but ensure number
        size: item.size ?? null,
        artistName: item.artistName ?? null,
      }
    })

    // Create JSON-safe order data - validate all required fields
    if (!data.user.name || typeof data.user.name !== 'string') {
      return res.status(400).json({ error: 'User name is required' })
    }

    if (!data.delivery.fullName || typeof data.delivery.fullName !== 'string') {
      return res.status(400).json({ error: 'Delivery fullName is required' })
    }

    if (!data.delivery.phone || typeof data.delivery.phone !== 'string') {
      return res.status(400).json({ error: 'Delivery phone is required' })
    }

    if (!data.delivery.address || typeof data.delivery.address !== 'string') {
      return res.status(400).json({ error: 'Delivery address is required' })
    }

    const orderDataJson = {
      user: {
        tgId: Number(data.user.tgId), // Keep as number in JSON
        name: String(data.user.name),
        username: data.user.username ? String(data.user.username) : null,
        photo_url: data.user.photo_url ? String(data.user.photo_url) : null,
      },
      items: itemsJson,
      delivery: {
        fullName: String(data.delivery.fullName),
        phone: String(data.delivery.phone),
        address: String(data.delivery.address),
        method: String(data.delivery.method),
      },
      comment: data.comment ? String(data.comment) : null,
      promoCode: promoCode ? String(promoCode) : null,
      discount: discount > 0 ? Number(discount) : null,
    }

    // Debug log before creating order
    console.log('[ORDER DEBUG]', {
      tgId: String(tgIdBigInt),
      itemsCount: normalizedItems.length,
      items: normalizedItems.map(item => ({
        title: item.title,
        price: item.price,
        qty: item.qty,
      })),
      totalPrice,
    })

    // Generate order ID once
    const orderId = uuidv4()

    // Extract telegramId from user data - use the tgId from request, not from DB lookup
    // The tgId is already validated and converted to BigInt above
    const userTelegramId = tgIdBigInt
    const userTelegramIdStr = String(userTelegramId)

    // Log order creation
    console.log('[order] created', {
      orderId,
      userId: userTelegramIdStr,
      telegramId: userTelegramIdStr,
    })

    // Initialize notification status
    let notifyUserStatus: 'PENDING' | 'SENT' | 'FAILED' = 'PENDING'
    let notifyUserError: string | null = null
    let userNotifyNeedsStart = false

    // Try to notify user if telegramId exists
    if (userTelegramId) {
      try {
        const orderForUserNotification = {
          id: orderId,
          total: totalPrice,
          items: normalizedItems.map(item => ({
            title: item.title,
            article: item.article ?? undefined,
            size: item.size ?? undefined,
            qty: item.qty,
            price: item.price,
            type: item.type ?? undefined,
            artistName: item.artistName ?? undefined,
          })),
          promoCode: promoCode ?? undefined,
          discount: discount > 0 ? discount : undefined,
          createdAt: new Date().toISOString(),
          userName: data.user.name,
        }

        // Convert BigInt to string for HTTP call (Telegram accepts both number and string)
        const telegramIdForNotify = String(userTelegramId)
        const notifyResult = await notifyUserAboutOrder(telegramIdForNotify, orderForUserNotification)

        if (notifyResult.ok) {
          notifyUserStatus = 'SENT'
          console.log('[order] notifyUser result', {
            status: 'SENT',
            needsStart: false,
          })
        } else {
          notifyUserStatus = 'FAILED'
          notifyUserError = `${notifyResult.code || 'UNKNOWN'}: ${notifyResult.desc || 'Unknown error'}`
          userNotifyNeedsStart = needsUserStart(notifyResult.code, notifyResult.desc)

          console.log('[order] notifyUser result', {
            status: 'FAILED',
            needsStart: userNotifyNeedsStart,
            error: notifyUserError,
          })
        }
      } catch (error: any) {
        notifyUserStatus = 'FAILED'
        notifyUserError = `EXCEPTION: ${error.message || 'Unknown exception'}`
        console.error('[order] notifyUser exception', { error: error.message })
      }
    } else {
      notifyUserStatus = 'FAILED'
      notifyUserError = 'NO_TELEGRAM_ID'
      userNotifyNeedsStart = true
      console.log('[order] notifyUser result', {
        status: 'FAILED',
        needsStart: true,
        error: 'NO_TELEGRAM_ID',
      })
    }

    // Create order with notification status
    const order = await prisma.order.create({
      data: {
        id: orderId,
        items: orderDataJson as any,
        total: totalPrice,
        status: 'new',
        tgId: tgIdBigInt,
        notifyUserStatus,
        notifyUserError,
        notifyUserTgId: userTelegramId,
      },
    })

    // Notify admins (don't wait, don't fail if it fails)
    console.log('[ORDER NOTIFY] start', { orderId: order.id })
    try {
      const orderForNotification = {
        ...order,
        items: order.items as any,
        totalPrice: order.total,
        createdAt: order.createdAt.toISOString(),
        updatedAt: order.updatedAt.toISOString(),
      }
      const notifyResult = await notifyAdminsAboutOrder(orderForNotification as any)
      console.log('[ORDER NOTIFY] success', { 
        orderId: order.id, 
        sent: notifyResult.success, 
        failed: notifyResult.failed 
      })
    } catch (error) {
      console.error('[ORDER NOTIFY] fail', { orderId: order.id, error })
      // Don't fail the request if notification fails
    }

    // Return 201 with order info and user notification status
    res.status(201).json({
      success: true,
      orderId: order.id,
      tgId: String(tgIdBigInt),
      createdAt: order.createdAt.toISOString(),
      userNotify: {
        status: notifyUserStatus,
        needsStart: userNotifyNeedsStart,
        error: notifyUserError || undefined,
      },
    })
  } catch (error: any) {
    // Handle custom validation errors (thrown with statusCode: 400)
    if (error.statusCode === 400) {
      return res.status(400).json({ error: error.message })
    }
    
    // Log full error for debugging
    console.error('[POST /api/orders] Error creating order:', {
      error: error.message || error,
      stack: error.stack,
      code: error.code,
    })
    
    // Return 500 for unexpected errors
    res.status(500).json({ error: 'Failed to create order' })
  }
})

// GET /api/orders?tgId=... - Get orders by Telegram ID
router.get('/', async (req, res) => {
  try {
    const tgIdRaw = req.query.tgId ? String(req.query.tgId).trim() : null

    if (!tgIdRaw) {
      return res.status(400).json({ error: 'tgId is required' })
    }

    // Log incoming tgId
    console.log('[GET /api/orders] Requested tgId:', tgIdRaw)

    // Parse tgId to BigInt
    let tgId: bigint
    try {
      tgId = BigInt(tgIdRaw)
    } catch (error) {
      console.error('[GET /api/orders] Invalid tgId:', tgIdRaw, error)
      return res.status(400).json({ error: 'Invalid tgId' })
    }

    const orders = await prisma.order.findMany({
      where: { tgId },
      orderBy: { createdAt: 'desc' },
    })
    
    // Normalize orders - extract itemsList and serialize BigInt and dates
    const normalizedOrders = orders.map(o => normalizeOrder(o))
    
    console.log('[GET /api/orders] Found orders:', { tgId: String(tgId), count: normalizedOrders.length })
    
    // Always return JSON array (even if empty)
    res.json(normalizedOrders)
  } catch (error: any) {
    console.error('[GET /api/orders] Error fetching orders:', error)
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
