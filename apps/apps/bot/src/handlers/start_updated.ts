import { Context } from 'telegraf'
import { InlineKeyboardMarkup } from 'telegraf/types'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { MenuActions } from './menu.js'
import { config } from '../config.js'
import { status } from '../ui/statusMessages.js'
import { addSubscriber } from './subscribe.js'

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

/**
 * Save user data and add as subscriber
 */
export function saveUser(user: {
  id: number
  username?: string
  first_name?: string
  last_name?: string
}) {
  // Добавляем пользователя как подписчика
  addSubscriber(user.id, true).catch(err => {
    console.error('Failed to add subscriber:', err)
  })
  
  console.log('✅ User registered/updated:', {
    id: user.id,
    username: user.username,
    name: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
  })
}

/**
 * Get welcome caption text
 */
export function getWelcomeCaption(user?: { first_name?: string }): string {     
  const name = user?.first_name ? `, ${user.first_name}` : ''
  return `Добро пожаловать в ASKED Store${name} 👋

Здесь ты можешь:
• Смотреть дропы и кастомы
• Заказывать мерч и кастомные худи
• Следить за проектами ASKED LAB

Выбирай действие ниже и полетели 🚀`
}

/**
 * Get main menu keyboard
 */
export function getMainMenuKeyboard(): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [
        {
          text: '🚀 Запустить приложение',
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
          text: '🧪 ASKED LAB',
          callback_data: MenuActions.ASKED_LAB,
        },
      ],
      [
        {
          text: '📢 Подписаться на новости',
          callback_data: MenuActions.SUBSCRIBE_NEWS,
        },
      ],
      [
        {
          text: '📱 Наш телеграм-канал',
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
  // Используем локальный файл из папки assets     
  // Абсолютный путь к файлу
  const videoPath = join(__dirname, '../../assets/welcom.mp4')
  return videoPath

  // Если нужно использовать URL из конфига, раскомментируйте:                                                    
  // return config.welcomeVideoUrl
}

/**
 * Handle /start command
 */
export async function handleStart(ctx: Context) {
  try {
    const user = ctx.from
    if (!user) {
      return ctx.reply('Ошибка: не удалось получить данные пользователя')                                              
    }

    // Register/update user and add as subscriber
    saveUser({
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
        await ctx.replyWithVideo({ source: videoSource }, {
          caption,
          reply_markup: keyboard,
        })
      }
    } else {
      // Fallback: send text message if no video
      await ctx.reply(caption, {
        reply_markup: keyboard,
      })
    }

    // Demo: отправка статусных сообщений с кастомными эмодзи                                                        
    try {
      await status.appStarting(ctx.telegram, ctx.chat.id)
      await status.labStarting(ctx.telegram, ctx.chat.id)
      await status.checkPayment(ctx.telegram, ctx.chat.id)
      await status.paymentOk(ctx.telegram, ctx.chat.id)
    } catch (error) {
      console.error('❌ Error sending status messages:', error)
      // Не прерываем выполнение, если ошибка в демо-сообщениях                                                   
    }
  } catch (error) {
    console.error('❌ Error in handleStart:', error)
    await ctx.reply('Произошла ошибка при обработке команды. Попробуйте позже.')                               
  }
}



