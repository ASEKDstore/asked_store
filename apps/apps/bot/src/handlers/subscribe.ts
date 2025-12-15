import { Context } from 'telegraf'

const BACKEND_API_URL = process.env.BACKEND_API_URL || process.env.API_URL || 'http://localhost:4000'

/**
 * Добавить/обновить подписчика через backend API
 */
export async function addSubscriber(tgId: number, enabled: boolean = true): Promise<boolean> {
  try {
    const response = await fetch(`${BACKEND_API_URL}/api/admin/telegram/subscribers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tgId, enabled }),
    })

    if (!response.ok) {
      console.error(`[SUBSCRIBE] Failed to add subscriber ${tgId}:`, await response.text())
      return false
    }

    return true
  } catch (error) {
    console.error(`[SUBSCRIBE] Error adding subscriber ${tgId}:`, error)
    return false
  }
}

/**
 * Обработчик команды /stop
 */
export async function handleStop(ctx: Context) {
  try {
    const user = ctx.from
    if (!user) {
      return ctx.reply('Ошибка: не удалось получить данные пользователя')
    }

    const success = await addSubscriber(user.id, false)
    
    if (success) {
      await ctx.reply('✅ Вы отписались от рассылки новостей.\n\nЧтобы подписаться снова, используйте /start')
    } else {
      await ctx.reply('❌ Произошла ошибка при отписке. Попробуйте позже.')
    }
  } catch (error) {
    console.error('❌ Error in handleStop:', error)
    await ctx.reply('Произошла ошибка при обработке команды. Попробуйте позже.')
  }
}

