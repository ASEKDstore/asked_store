import TelegramBot from 'node-telegram-bot-api'
import dotenv from 'dotenv'
import http from 'http'

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

// Команда /catalog
bot.onText(/\/catalog/, (msg) => {
  const chatId = msg.chat.id
  const miniAppUrl = process.env.MINI_APP_URL || 'https://your-miniapp-url.com'
  
  bot.sendMessage(chatId, 'Открыть каталог товаров:', {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: 'Каталог',
            web_app: { url: miniAppUrl }
          }
        ]
      ]
    }
  })
})

// HTTP сервер для health check (требуется Render)
const port = Number(process.env.PORT) || 10000
const server = http.createServer((req, res) => {
  if (req.url === '/health' || req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ status: 'ok', service: 'telegram-bot' }))
  } else {
    res.writeHead(404)
    res.end('Not Found')
  }
})

server.listen(port, '0.0.0.0', () => {
  console.log(`🤖 Telegram бот запущен...`)
  console.log(`🌐 Health check сервер на порту ${port}`)
})


