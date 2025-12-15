// Локальные типы для бота
type BotStep = {
  id: string
  name: string
  content: BotStepContent
  buttons?: BotButton[]
}

type BotStepContent =
  | { type: 'message'; text: string; parseMode?: 'HTML' | 'MarkdownV2'; entitiesJson?: any }
  | { type: 'photo'; imageUrl: string; caption?: string; parseMode?: 'HTML' | 'MarkdownV2'; entitiesJson?: any }

type BotButton = {
  id: string
  text: string
  kind: 'next' | 'url' | 'action'
  nextStepId?: string
  url?: string
  action?: string
}
import { config } from './config.js'

const BOT_TOKEN = config.botToken

const TELEGRAM_API_URL = 'https://api.telegram.org/bot'

/**
 * Отправить шаг пользователю
 */
export async function sendStep(chatId: number, step: BotStep, flowId?: string): Promise<boolean> {
  if (!BOT_TOKEN) {
    console.error('[FLOW SENDER] BOT_TOKEN not configured')
    return false
  }

  try {
    // Формируем inline keyboard из кнопок
    let replyMarkup: any = undefined
    if (step.buttons && step.buttons.length > 0) {
      const rows: any[][] = []
      for (let i = 0; i < step.buttons.length; i += 2) {
        const row = step.buttons.slice(i, i + 2).map(btn => {
          if (btn.kind === 'url') {
            return {
              text: btn.text,
              url: btn.url,
            }
          } else {
            // Для next и action используем callback_data
            const callbackData = flowId 
              ? getButtonCallbackData(flowId, step.id, btn.id)
              : `flow:${flowId || 'unknown'}:step:${step.id}:btn:${btn.id}`
            return {
              text: btn.text,
              callback_data: callbackData,
            }
          }
        })
        rows.push(row)
      }
      replyMarkup = { inline_keyboard: rows }
    }

    // Отправляем в зависимости от типа контента
    if (step.content.type === 'message') {
      const payload: any = {
        chat_id: chatId,
        text: step.content.text,
        reply_markup: replyMarkup,
      }
      
      // Важно: если есть entitiesJson → НЕ отправляем parse_mode
      if (step.content.entitiesJson) {
        payload.entities = step.content.entitiesJson
        // НЕ добавляем parse_mode если есть entitiesJson
      } else if (step.content.parseMode) {
        payload.parse_mode = step.content.parseMode
      }

      const response = await fetch(`${TELEGRAM_API_URL}${BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const result = await response.json()
      if (!response.ok || !result.ok) {
        console.error('[FLOW SENDER] Failed to send message:', result)
        return false
      }
    } else if (step.content.type === 'photo') {
      const payload: any = {
        chat_id: chatId,
        photo: step.content.imageUrl,
        caption: step.content.caption || '',
        reply_markup: replyMarkup,
      }
      
      // Важно: Telegram не любит одновременно parse_mode + caption_entities
      // Если есть entitiesJson → НЕ отправляем parse_mode, только caption_entities
      // Если нет entitiesJson → можно parse_mode
      if (step.content.entitiesJson) {
        payload.caption_entities = step.content.entitiesJson
        // НЕ добавляем parse_mode если есть entitiesJson
      } else if (step.content.parseMode) {
        payload.parse_mode = step.content.parseMode
      }

      const response = await fetch(`${TELEGRAM_API_URL}${BOT_TOKEN}/sendPhoto`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const result = await response.json()
      if (!response.ok || !result.ok) {
        console.error('[FLOW SENDER] Failed to send photo:', result)
        return false
      }
    }

    return true
  } catch (error) {
    console.error('[FLOW SENDER] Error sending step:', error)
    return false
  }
}

/**
 * Получить callback_data для кнопки
 */
export function getButtonCallbackData(flowId: string, stepId: string, buttonId: string): string {
  return `flow:${flowId}:step:${stepId}:btn:${buttonId}`
}

/**
 * Парсить callback_data
 */
export function parseCallbackData(data: string): { flowId: string; stepId: string; buttonId: string } | null {
  const parts = data.split(':')
  if (parts.length !== 5 || parts[0] !== 'flow' || parts[2] !== 'step' || parts[4] !== 'btn') {
    return null
  }
  return {
    flowId: parts[1],
    stepId: parts[3],
    buttonId: parts[5] || '',
  }
}

