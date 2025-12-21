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

/**
 * Format order message for admin notifications
 */
function formatAdminOrderMessage(order: {
  id: string
  status: string
  totalPrice: number
  items: any
  user: { name: string; username?: string; tgId: number }
  delivery: { fullName: string; phone: string; address: string; method: string }
  comment?: string
  promoCode?: string
  discount?: number
  createdAt: string
}): string {
  const statusEmoji: Record<string, string> = {
    new: '🆕',
    in_progress: '⚙️',
    done: '✅',
    canceled: '❌',
  }

  const deliveryMethodNames: Record<string, string> = {
    post: 'Почта России',
    cdek: 'СДЭК',
    avito: 'Авито',
  }

  const orderTypeLabel = 'Заказ'
  const items = Array.isArray(order.items?.items) ? order.items.items : []
  
  const itemsText = items
    .map((item: any) => {
      const baseText = `  • ${item.title} (${item.article || 'N/A'})${item.size ? ` - ${item.size}` : ''} × ${item.qty} = ${item.price * item.qty} ₽`
      if (item.type === 'lab' && item.artistName) {
        return `${baseText}\n    👨‍🎨 Художник: ${item.artistName}`
      }
      return baseText
    })
    .join('\n')

  const promoText = order.promoCode && order.discount
    ? `\n🎟️ <b>Промокод:</b> ${order.promoCode}\n💰 <b>Скидка:</b> ${order.discount.toLocaleString('ru-RU')} ₽\n`
    : ''

  return `
<b>${statusEmoji[order.status] || '📦'} ${orderTypeLabel} #${order.id.slice(-6).toUpperCase()}</b>

👤 <b>Покупатель:</b>
  Имя: ${order.user.name}
  ${order.user.username ? `@${order.user.username}` : ''}
  Telegram ID: ${order.user.tgId}

📦 <b>Товары:</b>
${itemsText}
${promoText}
💰 <b>Итого:</b> ${order.totalPrice.toLocaleString('ru-RU')} ₽

🚚 <b>Доставка:</b>
  ${order.delivery.fullName}
  ${order.delivery.phone}
  ${order.delivery.address}
  ${deliveryMethodNames[order.delivery.method] || order.delivery.method}

${order.comment ? `💬 <b>Комментарий:</b>\n${order.comment}\n` : ''}
📅 ${new Date(order.createdAt).toLocaleString('ru-RU')}
  `.trim()
}

/**
 * Send message to admin with inline keyboard
 */
async function sendToAdminSafe(
  chatId: number | string,
  text: string,
  keyboard?: { inline_keyboard: any[][] }
): Promise<{ ok: boolean; code?: number; desc?: string }> {
  if (!botInstance) {
    console.error('[notify-admin] Bot instance not initialized')
    return { ok: false, code: 500, desc: 'Bot not initialized' }
  }

  try {
    let targetChatId: number | string
    if (typeof chatId === 'string') {
      const numId = Number(chatId)
      targetChatId = Number.isSafeInteger(numId) ? numId : chatId
    } else {
      targetChatId = chatId
    }

    const options: any = { parse_mode: 'HTML' }
    if (keyboard) {
      options.reply_markup = keyboard
    }

    await botInstance.telegram.sendMessage(targetChatId, text, options)

    console.log('[notify-admin] SENT', { chatId: String(chatId) })
    return { ok: true }
  } catch (error: any) {
    const errorCode = error.response?.error_code || error.code || 500
    const errorDesc = error.response?.description || error.message || 'Unknown error'

    console.error('[notify-admin] FAILED', {
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

// POST /internal/notify-admins-order
app.post('/internal/notify-admins-order', requireInternalAuth, async (req: Request, res: Response) => {
  try {
    const { order, requestId } = req.body

    if (!order || !order.id) {
      return res.status(400).json({ error: 'order is required' })
    }

    const orderId = order.id
    const reqId = requestId || 'unknown'

    console.log('[internal] notify-admins-order received', {
      requestId: reqId,
      orderId,
      timestamp: new Date().toISOString(),
    })

    // Read admin IDs from environment variable
    const adminIdsEnv = process.env.TELEGRAM_ADMIN_IDS
    if (!adminIdsEnv) {
      console.warn('[internal] TELEGRAM_ADMIN_IDS not configured', { requestId: reqId, orderId })
      return res.json({ success: 0, failed: 0, total: 0 })
    }

    // Parse admin IDs
    const adminIds = adminIdsEnv
      .split(',')
      .map(id => id.trim())
      .filter(id => id.length > 0)
      .map(id => {
        const numId = Number(id)
        return Number.isFinite(numId) && numId > 0 ? numId : null
      })
      .filter((id): id is number => id !== null)

    if (adminIds.length === 0) {
      console.warn('[internal] No valid admin IDs found', { requestId: reqId, orderId, raw: adminIdsEnv })
      return res.json({ success: 0, failed: 0, total: 0 })
    }

    console.log('[internal] ADMIN_IDS', {
      requestId: reqId,
      orderId,
      adminIds,
      count: adminIds.length,
    })

    // Format message
    const message = formatAdminOrderMessage(order)

    // Create inline keyboard with action buttons
    const keyboard = {
      inline_keyboard: [
        [
          {
            text: '⚙️ В работу',
            callback_data: `order_action:${orderId}:in_progress`,
          },
          {
            text: '✅ Готово',
            callback_data: `order_action:${orderId}:done`,
          },
        ],
        [
          {
            text: '❌ Отменить',
            callback_data: `order_action:${orderId}:canceled`,
          },
        ],
      ],
    }

    // Send to all admins
    const results = await Promise.allSettled(
      adminIds.map(adminId => sendToAdminSafe(adminId, message, keyboard))
    )

    // Count results
    let successCount = 0
    let failCount = 0
    results.forEach((result, index) => {
      const adminId = adminIds[index]
      if (result.status === 'rejected') {
        console.error('[internal] SEND_FAILED', {
          requestId: reqId,
          orderId,
          adminId,
          error: result.reason,
        })
        failCount++
      } else if (result.value && result.value.ok) {
        console.log('[internal] SENT', {
          requestId: reqId,
          orderId,
          adminId,
        })
        successCount++
      } else if (result.value && !result.value.ok) {
        const error = result.value
        if (error.code === 403) {
          console.warn('[internal] ADMIN_MUST_START', {
            requestId: reqId,
            orderId,
            adminId,
            error: 'Admin must press Start in bot',
          })
        } else {
          console.error('[internal] SEND_FAILED', {
            requestId: reqId,
            orderId,
            adminId,
            error: error.desc || error.code,
          })
        }
        failCount++
      }
    })

    console.log('[internal] COMPLETE', {
      requestId: reqId,
      orderId,
      totalAdmins: adminIds.length,
      success: successCount,
      failed: failCount,
    })

    res.json({
      success: successCount,
      failed: failCount,
      total: adminIds.length,
    })
  } catch (error: any) {
    console.error('[internal] notify-admins-order error:', error)
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    })
  }
})

// Health check
app.get('/internal/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'bot-internal' })
})

export default app

