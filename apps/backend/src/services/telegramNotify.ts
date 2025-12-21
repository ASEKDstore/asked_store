import type { Order } from '../types/order.js'
import { prisma } from '../db/prisma.js'

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN

const TELEGRAM_API_URL = 'https://api.telegram.org/bot'

interface InlineKeyboardButton {
  text: string
  callback_data?: string
  url?: string
}

interface InlineKeyboardMarkup {
  inline_keyboard: InlineKeyboardButton[][]
}

async function sendMessage(
  chatId: number,
  text: string,
  parseMode: 'HTML' | 'Markdown' = 'HTML',
  replyMarkup?: InlineKeyboardMarkup
): Promise<{ success: boolean; error?: any }> {
  if (!BOT_TOKEN) {
    console.warn('[TELEGRAM NOTIFY] TELEGRAM_BOT_TOKEN not set, skipping notification')
    return { success: false, error: 'BOT_TOKEN not set' }
  }

  try {
    const response = await fetch(`${TELEGRAM_API_URL}${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: parseMode,
        reply_markup: replyMarkup,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      const statusCode = response.status
      
      // Handle cases where bot cannot write to user (403, 400)
      if (statusCode === 403) {
        console.warn(`[TELEGRAM NOTIFY] Cannot send message to ${chatId}: Admin must press Start in bot`)
        return { success: false, error: { statusCode, description: 'Admin must press Start' } }
      }
      
      if (statusCode === 400) {
        const errorDesc = errorData.description || errorData.error_code || 'Bad Request'
        console.warn(`[TELEGRAM NOTIFY] Cannot send message to ${chatId}: ${errorDesc}`)
        return { success: false, error: { statusCode, description: errorDesc } }
      }
      
      console.error(`[TELEGRAM NOTIFY] Telegram API error for ${chatId}:`, {
        status: statusCode,
        statusText: response.statusText,
        error: errorData,
      })
      return { success: false, error: { statusCode, ...errorData } }
    }
    
    return { success: true }
  } catch (error) {
    console.error(`[TELEGRAM NOTIFY] Failed to send message to ${chatId}:`, error)
    return { success: false, error }
  }
}

async function editMessageText(
  chatId: number,
  messageId: number,
  text: string,
  parseMode: 'HTML' | 'Markdown' = 'HTML',
  replyMarkup?: InlineKeyboardMarkup
) {
  if (!BOT_TOKEN) {
    console.warn('TELEGRAM_BOT_TOKEN not set, skipping edit')
    return
  }

  try {
    const response = await fetch(`${TELEGRAM_API_URL}${BOT_TOKEN}/editMessageText`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        message_id: messageId,
        text,
        parse_mode: parseMode,
        reply_markup: replyMarkup,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('Telegram API error:', error)
    }
  } catch (error) {
    console.error('Failed to edit Telegram message:', error)
  }
}

function formatClientOrderMessage(order: Order): string {
  const itemsText = order.items
    .map(item => {
      const baseText = `• ${item.title} (${item.article})${item.size ? ` - ${item.size}` : ''} × ${item.qty} = ${item.price * item.qty} ₽`
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
${promoText}
💰 Итого: ${order.totalPrice.toLocaleString('ru-RU')} ₽

Номер заказа: #${order.id.slice(-6).toUpperCase()}

Мы свяжемся с вами для подтверждения деталей доставки.`.trim()
}

function formatOrderMessage(order: Order): string {
  const statusEmoji = {
    new: '🆕',
    in_progress: '⚙️',
    done: '✅',
    canceled: '❌',
  }

  const deliveryMethodNames = {
    post: 'Почта России',
    cdek: 'СДЭК',
    avito: 'Авито',
  }

  // Check if order contains LAB items
  const hasLabItems = order.items.some(item => item.type === 'lab')
  const orderTypeLabel = hasLabItems ? '🧪 LAB ORDER' : 'Новый заказ'
  
  const itemsText = order.items
    .map(item => {
      const baseText = `  • ${item.title} (${item.article})${item.size ? ` - ${item.size}` : ''} × ${item.qty} = ${item.price * item.qty} ₽`
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
<b>${statusEmoji[order.status]} ${orderTypeLabel} #${order.id.slice(-6).toUpperCase()}</b>

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
  ${deliveryMethodNames[order.delivery.method]}

${order.comment ? `💬 <b>Комментарий:</b>\n${order.comment}\n` : ''}
📅 ${new Date(order.createdAt).toLocaleString('ru-RU')}
  `.trim()
}

async function notifyClientAboutOrder(order: Order): Promise<void> {
  try {
    if (!BOT_TOKEN) {
      console.warn('TELEGRAM_BOT_TOKEN not set, skipping client notification')
      return
    }

    const clientTgId = order.user.tgId
    if (!clientTgId || typeof clientTgId !== 'number') {
      console.warn('Invalid client tgId, skipping client notification')
      return
    }

    const message = formatClientOrderMessage(order)
    const result = await sendMessage(clientTgId, message)

    if (!result.success) {
      // Log but don't throw - client might not have started the bot
      if (result.error?.statusCode === 403 || result.error?.statusCode === 400) {
        console.warn(`Cannot send order confirmation to client ${clientTgId}: user may not have started the bot`)
      } else {
        console.error(`Failed to send order confirmation to client ${clientTgId}:`, result.error)
      }
    }
  } catch (error) {
    console.error('Error notifying client about order:', error)
    // Don't throw - notification failure should not break order creation
  }
}

export async function notifyAdminsAboutOrder(order: Order): Promise<{ success: number; failed: number }> {
  console.log('[ORDER NOTIFY] start', { orderId: order.id })
  
  try {
    if (!BOT_TOKEN) {
      console.warn('[ORDER NOTIFY] TELEGRAM_BOT_TOKEN not set, skipping notification')
      return { success: 0, failed: 0 }
    }

    // Read admin IDs from environment variable (comma-separated)
    const adminIdsEnv = process.env.TELEGRAM_ADMIN_IDS
    if (!adminIdsEnv) {
      console.warn('[ORDER NOTIFY] TELEGRAM_ADMIN_IDS not configured, skipping admin notification')
      return { success: 0, failed: 0 }
    }

    // Parse comma-separated admin IDs
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
      console.warn('[ORDER NOTIFY] No valid admin IDs found in TELEGRAM_ADMIN_IDS, skipping admin notification')
      return { success: 0, failed: 0 }
    }

    const message = formatOrderMessage(order)
    
    // Inline keyboard with action buttons
    const keyboard: InlineKeyboardMarkup = {
      inline_keyboard: [
        [
          {
            text: '⚙️ В работу',
            callback_data: `order_action:${order.id}:in_progress`,
          },
          {
            text: '✅ Готово',
            callback_data: `order_action:${order.id}:done`,
          },
        ],
        [
          {
            text: '❌ Отменить',
            callback_data: `order_action:${order.id}:canceled`,
          },
        ],
      ],
    }

    // Send to all admins (continue even if some fail)
    const results = await Promise.allSettled(
      adminIds.map(adminId => sendMessage(adminId, message, 'HTML', keyboard))
    )

    // Log results
    let successCount = 0
    let failCount = 0
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        console.error(`[ORDER NOTIFY] Failed to send notification to admin ${adminIds[index]}:`, result.reason)
        failCount++
      } else if (result.value && result.value.success) {
        successCount++
      } else if (result.value && !result.value.success) {
        const error = result.value.error
        if (error?.statusCode === 403) {
          console.warn(`[ORDER NOTIFY] Admin ${adminIds[index]} must press Start in bot`)
        } else {
          console.error(`[ORDER NOTIFY] Failed to send to admin ${adminIds[index]}:`, error)
        }
        failCount++
      }
    })

    console.log('[ORDER NOTIFY] success', {
      orderId: order.id,
      totalAdmins: adminIds.length,
      success: successCount,
      failed: failCount,
    })

    // Notify client (don't wait, don't fail if it fails)
    notifyClientAboutOrder(order).catch(error => {
      console.error('[ORDER NOTIFY] Error in client notification (non-blocking):', error)
    })

    return { success: successCount, failed: failCount }
  } catch (error) {
    console.error('[ORDER NOTIFY] fail', { orderId: order.id, error })
    // Don't throw - notification failure should not break order creation
    return { success: 0, failed: 0 }
  }
}

export async function updateOrderNotification(
  order: Order,
  chatId: number,
  messageId: number
): Promise<void> {
  try {
    const message = formatOrderMessage(order)
    
    // Update keyboard based on current status
    const keyboard: InlineKeyboardMarkup = {
      inline_keyboard: [
        ...(order.status === 'new' ? [[
          {
            text: '⚙️ В работу',
            callback_data: `order_action:${order.id}:in_progress`,
          },
          {
            text: '✅ Готово',
            callback_data: `order_action:${order.id}:done`,
          },
        ]] : []),
        ...(order.status === 'in_progress' ? [[
          {
            text: '✅ Готово',
            callback_data: `order_action:${order.id}:done`,
          },
          {
            text: '❌ Отменить',
            callback_data: `order_action:${order.id}:canceled`,
          },
        ]] : []),
        ...(order.status === 'done' || order.status === 'canceled' ? [] : []),
      ],
    }
    
    await editMessageText(chatId, messageId, message, 'HTML', keyboard)
  } catch (error) {
    console.error('Failed to update order notification:', error)
    // Don't throw - notification failure should not break order update
  }
}

export { sendMessage, editMessageText }

