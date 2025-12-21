/**
 * Bot service client for internal HTTP communication
 * Backend calls bot-service to send notifications to users
 */

const BOT_INTERNAL_URL = process.env.BOT_INTERNAL_URL || ''
const BOT_INTERNAL_KEY = process.env.BOT_INTERNAL_KEY || ''

interface NotifyOrderRequest {
  type: 'user_order_created'
  telegramId: number | string
  order: {
    id: string
    total: number
    items: Array<{
      title: string
      article?: string
      size?: string
      qty: number
      price: number
      type?: string
      artistName?: string
    }>
    promoCode?: string
    discount?: number
    createdAt: string
    userName?: string
  }
}

interface NotifyOrderResponse {
  ok: boolean
  code?: number
  desc?: string
}

/**
 * Send order notification to user via bot-service
 */
export async function notifyUserAboutOrder(
  telegramId: number | string,
  order: NotifyOrderRequest['order']
): Promise<NotifyOrderResponse> {
  if (!BOT_INTERNAL_URL) {
    console.warn('[BOT CLIENT] BOT_INTERNAL_URL not configured')
    return { ok: false, code: 500, desc: 'Bot service URL not configured' }
  }

  if (!BOT_INTERNAL_KEY) {
    console.warn('[BOT CLIENT] BOT_INTERNAL_KEY not configured')
    return { ok: false, code: 500, desc: 'Bot service key not configured' }
  }

  const payload: NotifyOrderRequest = {
    type: 'user_order_created',
    telegramId,
    order,
  }

  try {
    const response = await fetch(`${BOT_INTERNAL_URL}/internal/notify-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-key': BOT_INTERNAL_KEY,
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error')
      console.error('[BOT CLIENT] HTTP error', {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
      })
      return {
        ok: false,
        code: response.status,
        desc: errorText,
      }
    }

    const result: NotifyOrderResponse = await response.json()
    return result
  } catch (error: any) {
    console.error('[BOT CLIENT] Request failed', {
      error: error.message,
      stack: error.stack,
    })
    return {
      ok: false,
      code: 500,
      desc: error.message || 'Network error',
    }
  }
}

/**
 * Notify admins about order via bot-service internal endpoint
 * This ensures admin notifications use the same path as test notifications
 */
export async function notifyAdminsAboutOrderViaBot(
  order: {
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
  },
  requestId: string
): Promise<{ success: number; failed: number; total: number }> {
  if (!BOT_INTERNAL_URL) {
    console.warn('[BOT CLIENT] BOT_INTERNAL_URL not configured for admin notifications')
    return { success: 0, failed: 0, total: 0 }
  }

  if (!BOT_INTERNAL_KEY) {
    console.warn('[BOT CLIENT] BOT_INTERNAL_KEY not configured for admin notifications')
    return { success: 0, failed: 0, total: 0 }
  }

  try {
    const response = await fetch(`${BOT_INTERNAL_URL}/internal/notify-admins-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-key': BOT_INTERNAL_KEY,
      },
      body: JSON.stringify({
        order,
        requestId,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error')
      console.error('[BOT CLIENT] HTTP error for admin notifications', {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
        requestId,
      })
      return { success: 0, failed: 0, total: 0 }
    }

    const result = await response.json()
    return {
      success: result.success || 0,
      failed: result.failed || 0,
      total: result.total || 0,
    }
  } catch (error: any) {
    console.error('[BOT CLIENT] Request failed for admin notifications', {
      error: error.message,
      stack: error.stack,
      requestId,
    })
    return { success: 0, failed: 0, total: 0 }
  }
}

/**
 * Check if error indicates user needs to start bot
 */
export function needsUserStart(errorCode?: number, errorDesc?: string): boolean {
  if (!errorCode && !errorDesc) return false

  // Telegram error codes that indicate bot can't message user
  if (errorCode === 403) return true
  if (errorCode === 400 && errorDesc) {
    const desc = errorDesc.toLowerCase()
    if (
      desc.includes('chat not found') ||
      desc.includes("can't initiate conversation") ||
      desc.includes('bot was blocked') ||
      desc.includes('user is deactivated')
    ) {
      return true
    }
  }

  return false
}

