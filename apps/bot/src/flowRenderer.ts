/**
 * Flow Renderer
 * Renders BotFlowNode to Telegram messages with support for:
 * - sendMessage / editMessageText
 * - media (photo/video/animation)
 * - auto-delete
 * - edit-message animations
 * - one-message screen (prefer edit over send)
 */

import { Context } from 'telegraf'
import { config } from './config.js'

const BOT_TOKEN = config.botToken
const TELEGRAM_API_URL = 'https://api.telegram.org/bot'

type BotFlowNode = {
  id: string
  title: string
  type: 'MESSAGE' | 'MEDIA' | 'INPUT' | 'ACTION' | 'MENU'
  content: any
  keyboard?: any
  effects?: any
}

/**
 * Generate callback_data for flow button
 * Format: flow:flowId:node:nodeId:btn:buttonId
 * Note: Must be <= 64 bytes (Telegram limit)
 */
export function getButtonCallbackData(flowId: string, nodeId: string, buttonId: string): string {
  // Use short IDs to stay within 64 bytes
  const shortFlowId = flowId.substring(0, 8)
  const shortNodeId = nodeId.substring(0, 8)
  const shortButtonId = buttonId.substring(0, 8)
  return `flow:${shortFlowId}:node:${shortNodeId}:btn:${shortButtonId}`
}

/**
 * Render node to Telegram message
 * Returns message ID if successful
 */
export async function renderNode(
  ctx: Context,
  node: BotFlowNode,
  lastMessageId?: number | null,
  flowId?: string
): Promise<number | null> {
  try {
    const chatId = ctx.chat?.id
    if (!chatId) {
      console.error('[FLOW RENDERER] No chat ID')
      return null
    }

    // Build keyboard from node.keyboard
    let replyMarkup: any = undefined
    if (node.keyboard) {
      const keyboard = node.keyboard as any
      if (keyboard.type === 'inline' && keyboard.buttons) {
        // Convert buttons to Telegram format
        const inlineButtons = keyboard.buttons.map((row: any[]) =>
          row.map((btn: any) => {
            if (btn.url) {
              return { text: btn.text, url: btn.url }
            } else if (btn.web_app) {
              return { text: btn.text, web_app: btn.web_app }
            } else {
              // Generate callback_data
              const callbackData = flowId && node.id && btn.id
                ? getButtonCallbackData(flowId, node.id, btn.id)
                : btn.callback_data || `btn:${btn.id || 'unknown'}`
              
              // Ensure callback_data is <= 64 bytes
              if (callbackData.length > 64) {
                console.warn('[FLOW RENDERER] Callback data too long, truncating:', callbackData)
                return { text: btn.text, callback_data: callbackData.substring(0, 64) }
              }
              
              return { text: btn.text, callback_data: callbackData }
            }
          })
        )
        replyMarkup = { inline_keyboard: inlineButtons }
      } else if (keyboard.type === 'reply' && keyboard.buttons) {
        replyMarkup = { keyboard: keyboard.buttons, resize_keyboard: true }
      }
    }

    // Try to edit existing message if we have lastMessageId and effects allow
    const effects = node.effects as any
    const canEdit = lastMessageId && !effects?.preventEdit

    if (canEdit && node.type === 'MESSAGE') {
      try {
        const content = node.content as any
        const payload: any = {
          chat_id: chatId,
          message_id: lastMessageId,
          text: content?.text || '',
        }

        if (replyMarkup) {
          payload.reply_markup = replyMarkup
        }

        if (content?.parseMode && !content?.entitiesJson) {
          payload.parse_mode = content.parseMode
        }

        if (content?.entitiesJson) {
          payload.entities = content.entitiesJson
        }

        const response = await fetch(`${TELEGRAM_API_URL}${BOT_TOKEN}/editMessageText`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })

        const result = (await response.json()) as any
        if (response.ok && result.ok) {
          return lastMessageId
        }
      } catch (error) {
        console.warn('[FLOW RENDERER] Edit failed, falling back to send:', error)
        // Fall through to send new message
      }
    }

    // Send new message
    if (node.type === 'MESSAGE') {
      const content = node.content as any
      const payload: any = {
        chat_id: chatId,
        text: content?.text || '',
        reply_markup: replyMarkup,
      }

      if (content?.parseMode && !content?.entitiesJson) {
        payload.parse_mode = content.parseMode
      }

      if (content?.entitiesJson) {
        payload.entities = content.entitiesJson
      }

      const response = await fetch(`${TELEGRAM_API_URL}${BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const result = (await response.json()) as any
      if (response.ok && result.ok) {
        return result.result.message_id
      } else {
        console.error('[FLOW RENDERER] Failed to send message:', result)
        return null
      }
    } else if (node.type === 'MEDIA') {
      const content = node.content as any
      const mediaUrl = content?.mediaUrl || content?.imageUrl || content?.photoUrl
      const caption = content?.caption || ''

      if (!mediaUrl) {
        console.error('[FLOW RENDERER] No media URL')
        return null
      }

      // Determine media type
      const isPhoto = /\.(jpg|jpeg|png|gif|webp)$/i.test(mediaUrl)
      const isVideo = /\.(mp4|mov|avi|mkv)$/i.test(mediaUrl)
      const isAnimation = /\.(gif|webm)$/i.test(mediaUrl)

      const endpoint = isPhoto ? 'sendPhoto' : isVideo ? 'sendVideo' : isAnimation ? 'sendAnimation' : 'sendPhoto'
      const mediaField = isPhoto ? 'photo' : isVideo ? 'video' : isAnimation ? 'animation' : 'photo'

      const payload: any = {
        chat_id: chatId,
        [mediaField]: mediaUrl,
        caption: caption,
        reply_markup: replyMarkup,
      }

      if (content?.parseMode && !content?.entitiesJson) {
        payload.parse_mode = content.parseMode
      }

      if (content?.entitiesJson) {
        payload.caption_entities = content.entitiesJson
      }

      const response = await fetch(`${TELEGRAM_API_URL}${BOT_TOKEN}/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const result = (await response.json()) as any
      if (response.ok && result.ok) {
        return result.result.message_id
      } else {
        console.error('[FLOW RENDERER] Failed to send media:', result)
        return null
      }
    }

    return null
  } catch (error) {
    console.error('[FLOW RENDERER] Error rendering node:', error)
    return null
  }
}

/**
 * Execute edit-message animation effect
 */
export async function executeEditAnimation(
  ctx: Context,
  messageId: number,
  animation: { frames: string[]; intervalMs: number; finalText?: string }
): Promise<void> {
  const chatId = ctx.chat?.id
  if (!chatId) return

  try {
    // Throttle: max 8 frames, min 200ms interval
    const frames = animation.frames.slice(0, 8)
    const interval = Math.max(animation.intervalMs || 500, 200)

    for (const frame of frames) {
      try {
        await fetch(`${TELEGRAM_API_URL}${BOT_TOKEN}/editMessageText`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            message_id: messageId,
            text: frame,
          }),
        })

        await new Promise(resolve => setTimeout(resolve, interval))
      } catch (error) {
        console.warn('[FLOW RENDERER] Animation frame failed:', error)
        // Continue with next frame
      }
    }

    // Final text if provided
    if (animation.finalText) {
      try {
        await fetch(`${TELEGRAM_API_URL}${BOT_TOKEN}/editMessageText`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            message_id: messageId,
            text: animation.finalText,
          }),
        })
      } catch (error) {
        console.warn('[FLOW RENDERER] Final animation text failed:', error)
      }
    }
  } catch (error) {
    console.error('[FLOW RENDERER] Animation error:', error)
  }
}

/**
 * Delete message after delay
 */
export function scheduleDelete(chatId: number, messageId: number, delayMs: number): void {
  if (delayMs <= 0) return

  setTimeout(async () => {
    try {
      await fetch(`${TELEGRAM_API_URL}${BOT_TOKEN}/deleteMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          message_id: messageId,
        }),
      })
    } catch (error) {
      console.warn('[FLOW RENDERER] Auto-delete failed:', error)
    }
  }, delayMs)
}
