import type { Order } from '../types/order'
import { listAdmins } from '../store/adminsStore.js'

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
) {
  if (!BOT_TOKEN) {
    console.warn('TELEGRAM_BOT_TOKEN not set, skipping notification')
    return
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
      const error = await response.json()
      console.error('Telegram API error:', error)
    }
  } catch (error) {
    console.error('Failed to send Telegram message:', error)
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

export async function notifyAdminsAboutOrder(order: Order): Promise<void> {
  try {
    const adminIds = await listAdmins()
    
    if (adminIds.length === 0) {
      console.warn('No admin IDs configured, skipping notification')
      return
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

    // Send to all admins
    await Promise.all(
      adminIds.map(adminId => sendMessage(adminId, message, 'HTML', keyboard))
    )
  } catch (error) {
    console.error('Failed to notify admins about order:', error)
  }
}

export async function updateOrderNotification(
  order: Order,
  chatId: number,
  messageId: number
): Promise<void> {
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
}

export { sendMessage, editMessageText }

