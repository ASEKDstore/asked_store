import express, { Request, Response } from 'express'
import { Telegraf } from 'telegraf'
import { config } from './config.js'

const app = express()

// Middleware
app.use(express.json())

// Internal auth middleware
function requireInternalAuth(req: Request, res: Response, next: Function) {
  const internalKey = req.headers['x-internal-key']
  const expectedKey = process.env.BOT_INTERNAL_KEY

  if (!expectedKey) {
    console.error('[INTERNAL] BOT_INTERNAL_KEY not configured')
    return res.status(500).json({ error: 'Internal service not configured' })
  }

  if (internalKey !== expectedKey) {
    console.warn('[INTERNAL] Unauthorized internal request', { ip: req.ip })
    return res.status(401).json({ error: 'Unauthorized' })
  }

  next()
}

// Initialize bot instance for sending messages
let botInstance: Telegraf | null = null

export function initializeInternalServer(bot: Telegraf) {
  botInstance = bot
}

/**
 * Safely send message to user via Telegram Bot API
 */
async function sendToUserSafe(
  chatId: number | string,
  text: string
): Promise<{ ok: boolean; code?: number; desc?: string }> {
  if (!botInstance) {
    console.error('[notify-user] Bot instance not initialized')
    return { ok: false, code: 500, desc: 'Bot not initialized' }
  }

  try {
    // Convert chatId to appropriate type (Telegram accepts both number and string)
    let targetChatId: number | string
    if (typeof chatId === 'string') {
      // Try to convert to number if it fits in safe integer range
      const numId = Number(chatId)
      if (Number.isSafeInteger(numId)) {
        targetChatId = numId
      } else {
        targetChatId = chatId // Use as string for very large IDs
      }
    } else {
      targetChatId = chatId
    }

    await botInstance.telegram.sendMessage(targetChatId, text, { parse_mode: 'HTML' })

    console.log('[notify-user] SENT', { chatId: String(chatId) })
    return { ok: true }
  } catch (error: any) {
    const errorCode = error.response?.error_code || error.code || 500
    const errorDesc = error.response?.description || error.message || 'Unknown error'

    console.error('[notify-user] FAILED', {
      chatId: String(chatId),
      code: errorCode,
      desc: errorDesc,
    })

    return {
      ok: false,
      code: errorCode,
      desc: errorDesc,
    }
  }
}

/**
 * Format order confirmation message for user
 */
function formatUserOrderMessage(order: {
  id: string
  total: number
  items: Array<{ title: string; article?: string; size?: string; qty: number; price: number; type?: string; artistName?: string }>
  promoCode?: string
  discount?: number
  createdAt: string
  userName?: string
}): string {
  const itemsText = order.items
    .map(item => {
      const baseText = `• ${item.title}${item.article ? ` (${item.article})` : ''}${item.size ? ` - ${item.size}` : ''} × ${item.qty} = ${item.price * item.qty} ₽`
      if (item.type === 'lab' && item.artistName) {
        return `${baseText}\n  👨‍🎨 Художник: ${item.artistName}`
      }
      return baseText
    })
    .join('\n')

  const promoText = order.promoCode && order.discount
    ? `\n🎟️ Промокод: ${order.promoCode}\n💰 Скидка: ${order.discount.toLocaleString('ru-RU')} ₽\n`
    : ''

  return `✅ Заказ принят!

📦 Состав заказа:
${itemsText}
${promoText}💰 Итого: ${order.total.toLocaleString('ru-RU')} ₽

Номер заказа: #${order.id.slice(-6).toUpperCase()}

Мы свяжемся с вами для подтверждения деталей доставки.`.trim()
}

// POST /internal/notify-order
app.post('/internal/notify-order', requireInternalAuth, async (req: Request, res: Response) => {
  try {
    const { type, telegramId, order } = req.body

    if (type !== 'user_order_created') {
      return res.status(400).json({ error: 'Invalid notification type' })
    }

    if (!telegramId) {
      return res.status(400).json({ error: 'telegramId is required' })
    }

    if (!order || !order.id) {
      return res.status(400).json({ error: 'order is required' })
    }

    console.log('[internal] notify-order received', {
      telegramId: String(telegramId),
      orderId: order.id,
    })

    const message = formatUserOrderMessage(order)
    const result = await sendToUserSafe(telegramId, message)

    if (result.ok) {
      res.json({ ok: true })
    } else {
      res.json({
        ok: false,
        code: result.code,
        desc: result.desc,
      })
    }
  } catch (error: any) {
    console.error('[internal] notify-order error:', error)
    res.status(500).json({
      ok: false,
      code: 500,
      desc: error.message || 'Internal server error',
    })
  }
})

// Health check
app.get('/internal/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'bot-internal' })
})

export default app

