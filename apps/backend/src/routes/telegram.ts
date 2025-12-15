import { Router } from 'express'
import { readJson, writeJson } from '../store/jsonDb.js'
import { updateOrderNotification } from '../services/telegramNotify.js'
import type { Order } from '../types/order.js'

const router = Router()

// POST /api/telegram/webhook
router.post('/webhook', async (req, res) => {
  try {
    const update = req.body
    
    // Handle callback query (inline button clicks)
    if (update.callback_query) {
      const { data, message, from } = update.callback_query
      
      // Parse callback data: order_action:orderId:status
      if (data && data.startsWith('order_action:')) {
        const [, orderId, newStatus] = data.split(':')
        
        if (!orderId || !newStatus) {
          return res.json({ ok: true })
        }
        
        // Validate status
        const validStatuses = ['new', 'in_progress', 'done', 'canceled']
        if (!validStatuses.includes(newStatus)) {
          return res.json({ ok: true })
        }
        
        // Update order status
        const orders = await readJson<Order[]>('orders') || []
        const orderIndex = orders.findIndex(o => o.id === orderId)
        
        if (orderIndex === -1) {
          return res.json({ ok: true })
        }
        
        orders[orderIndex].status = newStatus as Order['status']
        orders[orderIndex].updatedAt = new Date().toISOString()
        
        await writeJson('orders', orders)
        
        // Update message in Telegram
        if (message && message.chat && message.message_id) {
          await updateOrderNotification(
            orders[orderIndex],
            message.chat.id,
            message.message_id
          )
        }
        
        // Answer callback query
        const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
        if (BOT_TOKEN) {
          await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              callback_query_id: update.callback_query.id,
              text: `Статус изменён на: ${newStatus === 'in_progress' ? 'В работе' : newStatus === 'done' ? 'Готово' : 'Отменено'}`,
            }),
          })
        }
      }
    }
    
    res.json({ ok: true })
  } catch (error: any) {
    console.error('Telegram webhook error:', error)
    res.status(500).json({ error: 'Webhook processing failed' })
  }
})

export default router



