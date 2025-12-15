import { Context } from 'telegraf'
import { InlineKeyboardMarkup } from 'telegraf/types'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { MenuActions } from './menu.js'
import { config } from '../config.js'

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

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
 * Get welcome caption text (will be replaced by BotFlows)
 */
export function getWelcomeCaption(user?: { first_name?: string }): string {
  // Placeholder - will be replaced by BotFlows from database
  return 'Добро пожаловать!'
}

/**
 * Get main menu keyboard
 */
export function getMainMenuKeyboard(): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [
        {
          text: '📱 Открыть приложение',
          callback_data: MenuActions.OPEN_APP,
        },
      ],
      [
        {
          text: '📦 Мои заказы',
          callback_data: MenuActions.MY_ORDERS,
        },
      ],
      [
        {
          text: '🎨 ASKED LAB',
          callback_data: MenuActions.ASKED_LAB,
        },
      ],
      [
        {
          text: '📢 Наш канал',
          url: config.telegramChannelUrl || 'https://t.me/asked_store',
        },
      ],
    ],
  }
}

/**
 * Get welcome video source
 * Can be local file path or URL
 */
export function getWelcomeVideoSource(): string | undefined {
  const videoPath = join(__dirname, '../../assets/welcom.mp4')
  return videoPath
}

/**
 * Handle /start command
 * Messages will be managed through BotFlows API
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

    // Get video source
    const videoSource = getWelcomeVideoSource()
    const caption = getWelcomeCaption(user)
    const keyboard = getMainMenuKeyboard()

    // Send video with caption and keyboard
    if (videoSource) {
      // If it's a URL, use it directly
      if (videoSource.startsWith('http://') || videoSource.startsWith('https://')) {
        await ctx.replyWithVideo(videoSource, {
          caption,
          reply_markup: keyboard,
        })
      } else {
        // If it's a local file path, use source
        try {
          await ctx.replyWithVideo({ source: videoSource }, {
            caption,
            reply_markup: keyboard,
          })
        } catch (error) {
          // Fallback if video file not found
          await ctx.reply(caption, {
            reply_markup: keyboard,
          })
        }
      }
    } else {
      // Fallback: send text message if no video
      await ctx.reply(caption, {
        reply_markup: keyboard,
      })
    }
  } catch (error) {
    console.error('❌ Error in handleStart:', error)
    await ctx.reply('Произошла ошибка при обработке команды. Попробуйте позже.')
  }
}
