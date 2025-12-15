import { Context } from 'telegraf'
import { config } from '../config.js'

/**
 * Save user data to backend
 */
async function saveUser(user: {
  id: number
  username?: string
  first_name?: string
  last_name?: string
}) {
  try {
    const backendUrl = config.backendUrl
    if (!backendUrl) {
      console.warn('Backend URL not configured, skipping user save')
      return
    }

    await fetch(`${backendUrl}/api/telegram/subscribers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tgId: user.id,
        username: user.username,
        firstName: user.first_name,
        lastName: user.last_name,
        isActive: true,
      }),
    })
  } catch (error) {
    console.error('Failed to save user to backend:', error)
  }
}

/**
 * Get ReplyKeyboard with web_app button
 * This ensures Mini App opens in WebApp mode, not in browser
 */
export function getWebAppKeyboard() {
  return {
    reply_markup: {
      keyboard: [
        [
          {
            text: '🛍 Открыть ASKED Store',
            web_app: {
              url: config.webappUrl,
            },
          },
        ],
      ],
      resize_keyboard: true,
      one_time_keyboard: false,
    },
  }
}

/**
 * Handle /start command
 * Always sends reply keyboard with web_app button
 */
export async function handleStart(ctx: Context) {
  try {
    const user = ctx.from
    if (!user) {
      return ctx.reply('Ошибка: не удалось получить данные пользователя')
    }

    // Register/update user in backend
    await saveUser({
      id: user.id,
      username: user.username,
      first_name: user.first_name,
      last_name: user.last_name,
    })

    // Send welcome message with web_app button
    const welcomeText = 'Добро пожаловать в ASKED 🖤\n\nОткрывай магазин кнопкой ниже — так Telegram корректно передаст WebApp-контекст.'
    
    await ctx.reply(welcomeText, getWebAppKeyboard())
  } catch (error) {
    console.error('❌ Error in handleStart:', error)
    await ctx.reply('Произошла ошибка при обработке команды. Попробуйте позже.')
  }
}

/**
 * Handle /store command
 * Sends web_app button if user lost it
 */
export async function handleStore(ctx: Context) {
  try {
    await ctx.reply('Жми кнопку ниже 👇', getWebAppKeyboard())
  } catch (error) {
    console.error('❌ Error in handleStore:', error)
    await ctx.reply('Произошла ошибка. Попробуйте позже.')
  }
}
