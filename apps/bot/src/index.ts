import TelegramBot from 'node-telegram-bot-api'
import dotenv from 'dotenv'

dotenv.config()

const token = process.env.TELEGRAM_BOT_TOKEN

if (!token) {
  throw new Error('TELEGRAM_BOT_TOKEN не установлен в переменных окружения')
}

const bot = new TelegramBot(token, { polling: true })

// Команда /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id
  const miniAppUrl = process.env.MINI_APP_URL || 'https://your-miniapp-url.com'
  
  bot.sendMessage(chatId, 'Добро пожаловать в магазин одежды!', {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: 'Открыть магазин',
            web_app: { url: miniAppUrl }
          }
        ]
      ]
    }
  })
})

// Команда /help
bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id
  bot.sendMessage(chatId, `
Доступные команды:
/start - Начать работу с ботом
/help - Показать справку
/catalog - Открыть каталог товаров
  `)
})

console.log('🤖 Telegram бот запущен...')

