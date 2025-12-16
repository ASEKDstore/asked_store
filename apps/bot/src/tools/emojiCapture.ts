/**
 * Инструмент для захвата custom_emoji_id из входящих сообщений
 * 
 * Использование: EMOJI_CAPTURE=1 npm run dev
 * 
 * Когда флаг установлен, бот логирует все найденные custom_emoji_id
 * в консоль для последующего копирования в emojiMap.ts
 */

import { Context } from 'telegraf'

const EMOJI_CAPTURE_ENABLED = process.env.EMOJI_CAPTURE === '1'

/**
 * Обработчик для захвата custom_emoji_id из сообщений
 * Работает только с text messages
 */
export function captureCustomEmojis(ctx: Context) {
  if (!EMOJI_CAPTURE_ENABLED) {
    return
  }

  const message = ctx.message
  // Работаем только с text messages
  if (!message || !('text' in message)) {
    return
  }

  const text = message.text
  if (!text) {
    return
  }

  // Проверяем наличие entities (может быть undefined)
  const entities = message.entities
  if (!entities || entities.length === 0) {
    return
  }

  // Ищем custom_emoji
  const customEmojis = entities.filter(
    (entity): entity is typeof entity & { type: 'custom_emoji' } =>
      entity.type === 'custom_emoji'
  )

  if (customEmojis.length === 0) {
    return
  }

  // Логируем найденные эмодзи
  for (const entity of customEmojis) {
    const emojiText = text.substring(entity.offset, entity.offset + entity.length)
    const emojiId = String(entity.custom_emoji_id)
    
    console.log(
      `[EMOJI] id=${emojiId} offset=${entity.offset} length=${entity.length} text="${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`
    )
    console.log(`💡 Сохрани этот ID в emojiMap.ts`)
    
    // Автоматически сохраняем ID в файл (опционально, можно раскомментировать)
    // try {
    //   const emojiMapPath = join(__dirname, '../ui/emojiMap.ts')
    //   let emojiMapContent = readFileSync(emojiMapPath, 'utf-8')
    //   // Простая замена - требует ручной настройки маппинга
    //   console.log(`📝 ID для сохранения: ${emojiId}`)
    // } catch (err) {
    //   console.error('Ошибка при сохранении:', err)
    // }
  }
}

/**
 * Middleware для Telegraf
 */
export function emojiCaptureMiddleware(ctx: Context, next: () => Promise<void>) {
  if (EMOJI_CAPTURE_ENABLED) {
    captureCustomEmojis(ctx)
  }
  return next()
}

