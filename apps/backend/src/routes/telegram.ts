import { Router } from 'express'
import { prisma } from '../db/prisma.js'
import { updateOrderNotification } from '../services/telegramNotify.js'

const router = Router()

// POST /api/telegram/webhook
router.post('/webhook', async (req, res) => {
  try {
    const update = req.body
    
    // Handle callback query (inline button clicks)
    if (update.callback_query) {
      const { data, message } = update.callback_query
      
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
        const order = await prisma.order.findUnique({
          where: { id: orderId },
        })
        
        if (!order) {
          return res.json({ ok: true })
        }
        
        const updatedOrder = await prisma.order.update({
          where: { id: orderId },
          data: { status: newStatus },
        })
        
        // Update message in Telegram
        if (message && message.chat && message.message_id) {
          const orderForNotification = {
            ...updatedOrder,
            items: updatedOrder.items as any,
            createdAt: updatedOrder.createdAt.toISOString(),
            updatedAt: updatedOrder.updatedAt.toISOString(),
          }
          await updateOrderNotification(
            orderForNotification as any,
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
