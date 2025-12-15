import { Router, Request, Response, NextFunction } from 'express'
import { readJson, writeJson } from '../../store/jsonDb.js'
import type { Subscriber } from './telegramSubscribers.js'

const router = Router()

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const TELEGRAM_API_URL = 'https://api.telegram.org/bot'

interface TgButton {
  text: string
  url: string
}

interface TgPostPayload {
  mode: 'channel' | 'broadcast' | 'both'
  channelChatId?: string  // default "@asked_store"
  text: string
  imageUrl?: string
  buttons?: TgButton[]
  parseMode?: 'HTML' | 'MarkdownV2'
  disableWebPagePreview?: boolean
}

// Функция отправки сообщения в Telegram
async function sendTelegramMessage(
  chatId: string | number,
  text: string,
  options: {
    imageUrl?: string
    replyMarkup?: any
    parseMode?: 'HTML' | 'MarkdownV2'
    disableWebPagePreview?: boolean
  }
): Promise<{ ok: boolean; messageId?: number; error?: string }> {
  const { imageUrl, replyMarkup, parseMode = 'HTML', disableWebPagePreview = false } = options

  try {
    let tgResponse: Response
    let result: any

    if (imageUrl) {
      tgResponse = await fetch(`${TELEGRAM_API_URL}${BOT_TOKEN}/sendPhoto`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          photo: imageUrl,
          caption: text,
          parse_mode: parseMode,
          reply_markup: replyMarkup,
          disable_web_page_preview: disableWebPagePreview,
        }),
      })
    } else {
      tgResponse = await fetch(`${TELEGRAM_API_URL}${BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: parseMode,
          reply_markup: replyMarkup,
          disable_web_page_preview: disableWebPagePreview,
        }),
      })
    }

    result = await tgResponse.json()

    if (!tgResponse.ok || !result.ok) {
      const errorMessage = result.description || result.error_code || 'Unknown Telegram API error'
      return { ok: false, error: String(errorMessage) }
    }

    return { ok: true, messageId: result.result?.message_id }
  } catch (error: any) {
    return { ok: false, error: error.message || 'Network error' }
  }
}

// POST /api/admin/telegram/post
// requireAdmin применяется в server.ts
router.post('/post', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!BOT_TOKEN) {
      return res.status(500).json({ error: 'TELEGRAM_BOT_TOKEN not configured' })
    }

    const payload: TgPostPayload = req.body
    const { mode, channelChatId, text, imageUrl, buttons, parseMode = 'HTML', disableWebPagePreview = false } = payload

    // Валидация
    if (!mode || !text) {
      return res.status(400).json({ message: 'mode and text are required' })
    }

    if (!['channel', 'broadcast', 'both'].includes(mode)) {
      return res.status(400).json({ message: 'mode must be "channel", "broadcast" or "both"' })
    }

    // Дефолтный канал
    const targetChannelChatId = channelChatId ?? '@asked_store'

    // Проверка длины текста
    const maxLength = imageUrl ? 1024 : 4096
    if (text.length > maxLength) {
      return res.status(400).json({ 
        error: `Text too long. Maximum length: ${maxLength} characters, got: ${text.length}` 
      })
    }

    // Формируем inline keyboard
    let replyMarkup: any = undefined
    if (buttons && buttons.length > 0) {
      const rows: any[][] = []
      for (let i = 0; i < buttons.length; i += 2) {
        const row = buttons.slice(i, i + 2).map(btn => ({
          text: btn.text,
          url: btn.url,
        }))
        rows.push(row)
      }
      replyMarkup = { inline_keyboard: rows }
    }

    // Логирование
    console.log('[TELEGRAM POST]', {
      mode,
      channelChatId: targetChannelChatId,
      hasImage: !!imageUrl,
      buttonsCount: buttons?.length || 0,
      textLength: text.length,
      timestamp: new Date().toISOString(),
    })

    const sendOptions = {
      imageUrl,
      replyMarkup,
      parseMode,
      disableWebPagePreview,
    }

    let channelResult: { messageId: number } | undefined
    const broadcastResult = { sent: 0, failed: 0, disabled: 0 }

    // Отправка в канал
    if (mode === 'channel' || mode === 'both') {
      const result = await sendTelegramMessage(targetChannelChatId, text, sendOptions)
      if (result.ok && result.messageId) {
        channelResult = { messageId: result.messageId }
      } else {
        return res.status(400).json({
          message: result.error || 'Failed to send to channel',
        })
      }
    }

    // Рассылка подписчикам
    if (mode === 'broadcast' || mode === 'both') {
      const subscribers = await readJson<Subscriber[]>('telegram_subscribers', [])
      const activeSubscribers = subscribers.filter(s => s.enabled)

      console.log(`[TELEGRAM BROADCAST] Starting to ${activeSubscribers.length} subscribers`)

      // Батчами по 25 с задержкой 150мс между батчами
      const BATCH_SIZE = 25
      const BATCH_DELAY = 150

      for (let i = 0; i < activeSubscribers.length; i += BATCH_SIZE) {
        const batch = activeSubscribers.slice(i, i + BATCH_SIZE)
        
        await Promise.all(
          batch.map(async (subscriber) => {
            const result = await sendTelegramMessage(subscriber.tgId, text, sendOptions)
            
            if (result.ok) {
              broadcastResult.sent++
              // Обновляем lastSentAt
              subscriber.lastSentAt = new Date().toISOString()
            } else {
              // Проверяем, заблокирован ли бот (403, "bot was blocked by the user", "chat not found")
              const errorText = result.error?.toLowerCase() || ''
              if (
                result.error?.includes('403') ||
                errorText.includes('bot was blocked by the user') ||
                errorText.includes('chat not found') ||
                errorText.includes('forbidden')
              ) {
                subscriber.enabled = false
                broadcastResult.disabled++
                console.log(`[TELEGRAM BROADCAST] User ${subscriber.tgId} blocked bot or chat not found, disabled`)
              } else {
                broadcastResult.failed++
                console.log(`[TELEGRAM BROADCAST] Failed to send to ${subscriber.tgId}: ${result.error}`)
              }
            }
          })
        )

        // Задержка между батчами (кроме последнего)
        if (i + BATCH_SIZE < activeSubscribers.length) {
          await new Promise(resolve => setTimeout(resolve, BATCH_DELAY))
        }
      }

      // Сохраняем обновлённых подписчиков
      if (broadcastResult.disabled > 0) {
        await writeJson('telegram_subscribers', subscribers)
      }
    }

    const response: any = { ok: true }
    if (channelResult) {
      response.channel = channelResult
    }
    if (mode === 'broadcast' || mode === 'both') {
      response.broadcast = broadcastResult
    }

    res.json(response)
  } catch (error: any) {
    console.error('[TELEGRAM POST] Unexpected error:', error)
    next(error)
  }
})

export default router

