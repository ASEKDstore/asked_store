/**
 * Утилита для отправки сообщений с кастомными анимированными эмодзи Telegram
 * 
 * Поддерживает как Telegraf, так и node-telegram-bot-api
 */

import { EMOJI } from './emojiMap.js'

type TelegramApi = {
  sendMessage?: (chatId: number | string, text: string, options?: any) => Promise<any>
  telegram?: {
    sendMessage?: (chatId: number | string, text: string, options?: any) => Promise<any>
  }
}

type Entity = {
  type: 'custom_emoji'
  offset: number
  length: number
  custom_emoji_id: string
}

type BuildEntitiesResult = {
  text: string
  entities: Entity[]
}

/**
 * Fallback эмодзи для случаев, когда custom_emoji_id не заполнен
 */
const FALLBACK_EMOJIS: Record<string, string> = {
  gear: '⚙️',
  green: '🟢',
  dots: '⏳',
  ok: '✅',
  heart: '❤️',
}

/**
 * Строит entities для Telegram API из текста с плейсхолдерами
 * 
 * @param text - Исходный текст с плейсхолдерами типа {green}, {gear}
 * @param tokens - Массив токенов для замены
 * @returns Объект с заменённым текстом и entities
 */
export function buildEntities(
  text: string,
  tokens: Array<{ key: string; placeholder: string }>
): BuildEntitiesResult {
  const entities: Entity[] = []
  let replacedText = text
  let offsetShift = 0

  // Заменяем плейсхолдеры и создаём entities
  for (const token of tokens) {
    const placeholder = token.placeholder
    const key = token.key
    const emojiId = EMOJI[key as keyof typeof EMOJI]

    // Находим все вхождения плейсхолдера
    let searchIndex = 0
    while (true) {
      const index = replacedText.indexOf(placeholder, searchIndex)
      if (index === -1) break

      // Если есть custom_emoji_id, используем его
      if (emojiId) {
        // Заменяем плейсхолдер на один символ-заглушку
        const placeholderLength = placeholder.length
        replacedText =
          replacedText.substring(0, index) +
          '•' +
          replacedText.substring(index + placeholderLength)

        // Создаём entity
        entities.push({
          type: 'custom_emoji',
          offset: index + offsetShift,
          length: 1,
          custom_emoji_id: String(emojiId),
        })

        // Корректируем offset для следующих entities
        offsetShift += 1 - placeholderLength
        searchIndex = index + 1
      } else {
        // Fallback: заменяем на обычный юникод эмодзи
        const fallbackEmoji = FALLBACK_EMOJIS[key] || '•'
        const placeholderLength = placeholder.length
        replacedText =
          replacedText.substring(0, index) +
          fallbackEmoji +
          replacedText.substring(index + placeholderLength)

        // Корректируем offset для следующих entities
        offsetShift += fallbackEmoji.length - placeholderLength
        searchIndex = index + fallbackEmoji.length
      }
    }
  }

  // Сортируем entities по offset
  entities.sort((a, b) => a.offset - b.offset)

  return {
    text: replacedText,
    entities,
  }
}

/**
 * Отправляет сообщение с кастомными эмодзи
 * 
 * Поддерживает:
 * - Telegraf: sendWithEmoji(ctx.telegram, ctx.chat.id, text)
 * - node-telegram-bot-api: sendWithEmoji(bot, chatId, text)
 * 
 * @param api - API объект (ctx.telegram или bot)
 * @param chatId - ID чата
 * @param text - Текст с плейсхолдерами типа {green}, {gear}
 */
export async function sendWithEmoji(
  api: TelegramApi,
  chatId: number | string,
  text: string
): Promise<void> {
  // Извлекаем токены из текста
  const tokenPattern = /\{(\w+)\}/g
  const tokens: Array<{ key: string; placeholder: string }> = []
  let match

  while ((match = tokenPattern.exec(text)) !== null) {
    const key = match[1]
    const placeholder = match[0]
    tokens.push({ key, placeholder })
  }

  // Строим entities
  const { text: replacedText, entities } = buildEntities(text, tokens)

  // Определяем метод отправки
  let sendMethod: (chatId: number | string, text: string, options?: any) => Promise<any>

  if (api.sendMessage) {
    // node-telegram-bot-api
    sendMethod = api.sendMessage.bind(api)
  } else if (api.telegram?.sendMessage) {
    // Telegraf
    sendMethod = api.telegram.sendMessage.bind(api.telegram)
  } else {
    throw new Error(
      'Не удалось найти метод sendMessage. Убедитесь, что передаёте правильный API объект (ctx.telegram или bot)'
    )
  }

  // Отправляем сообщение с entities
  await sendMethod(chatId, replacedText, {
    entities: entities.length > 0 ? entities : undefined,
  })
}




