import { Telegraf, Markup } from 'telegraf'
import { config } from './config.js'

const bot = new Telegraf(config.botToken)

// Command /start
bot.start(async (ctx) => {
  const message = `👋 Добро пожаловать в ASKED Store!

Нажмите кнопку ниже, чтобы открыть магазин.`

  if (config.webappUrl) {
    await ctx.reply(message, Markup.keyboard([
      Markup.button.webApp('🛍️ Открыть магазин', config.webappUrl),
    ]).resize())
  } else {
    await ctx.reply(message)
  }
})

// Launch bot
bot.launch().then(async () => {
  console.log('🤖 ASKED Store Bot is running')

  // Set menu button if webapp URL is configured
  if (config.webappUrl) {
    try {
      await bot.telegram.setChatMenuButton({
        menuButton: {
          type: 'web_app',
          text: 'Открыть ASKED Store',
          web_app: { url: config.webappUrl },
        },
      })
      console.log('✅ Menu button set with URL:', config.webappUrl)
    } catch (error) {
      console.warn('⚠️ Failed to set menu button:', error)
    }
  }
})

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))