import { Router } from 'express'
import { readJson } from '../../store/jsonDb.js'
import { updateOrderStatus, getOrderById } from '../../services/orderStorage.js'
import type { Order, OrderStatus } from '../../types/order.js'

const router = Router()

// GET /api/admin/orders
router.get('/', async (req, res) => {
  try {
    const { status, q, from, to } = req.query
    
    const orders = await readJson<Order[]>('orders') || []
    
    let filtered = orders
    
    // Filter by status
    if (status && typeof status === 'string') {
      filtered = filtered.filter(o => o.status === status)
    }
    
    // Search by id, username, phone
    if (q && typeof q === 'string') {
      const query = q.toLowerCase()
      filtered = filtered.filter(o => 
        o.id.toLowerCase().includes(query) ||
        o.user.username?.toLowerCase().includes(query) ||
        o.user.name.toLowerCase().includes(query) ||
        o.delivery.phone.includes(query)
      )
    }
    
    // Filter by date range
    if (from && typeof from === 'string') {
      const fromDate = new Date(from)
      filtered = filtered.filter(o => new Date(o.createdAt) >= fromDate)
    }
    
    if (to && typeof to === 'string') {
      const toDate = new Date(to)
      toDate.setHours(23, 59, 59, 999)
      filtered = filtered.filter(o => new Date(o.createdAt) <= toDate)
    }
    
    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    
    res.json(filtered)
  } catch (error: any) {
    console.error('Error fetching admin orders:', error)
    res.status(500).json({ error: 'Failed to fetch orders' })
  }
})

// GET /api/admin/orders/:id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const order = await getOrderById(id)
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' })
    }
    
    res.json(order)
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



