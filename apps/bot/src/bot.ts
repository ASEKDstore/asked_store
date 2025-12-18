import { Telegraf, Markup } from 'telegraf'

// Get bot token from env
const botToken = process.env.BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN
if (!botToken) {
  console.error('❌ ERROR: BOT_TOKEN or TELEGRAM_BOT_TOKEN is not set in environment variables')
  process.exit(1)
}

// Get WebApp URL from env
const webAppUrl = process.env.WEBAPP_URL
if (!webAppUrl) {
  console.error('❌ ERROR: WEBAPP_URL is not set in environment variables')
  // Don't exit - bot can still work, but will log error on /start
}

// Create bot instance
const bot = new Telegraf(botToken)

// WebApp keyboard with button
const getWebAppKeyboard = () => {
  if (!webAppUrl) {
    return undefined
  }
  return Markup.keyboard([
    [Markup.button.webApp('🛍 Открыть ASKED Store', webAppUrl)]
  ]).resize()
}

// /start command handler
bot.command('start', async (ctx) => {
  if (!webAppUrl) {
    await ctx.reply(
      '❌ Ошибка: WebApp URL не настроен.\n\nОбратитесь к администратору.'
    )
    return
  }

  const keyboard = getWebAppKeyboard()
  await ctx.reply(
    'Добро пожаловать в ASKED 🖤\n\nОткройте магазин кнопкой ниже — так Telegram корректно передаст WebApp-контекст.',
    keyboard
  )
})

// /store command handler
bot.command('store', async (ctx) => {
  if (!webAppUrl) {
    await ctx.reply(
      '❌ Ошибка: WebApp URL не настроен.\n\nОбратитесь к администратору.'
    )
    return
  }

  const keyboard = getWebAppKeyboard()
  await ctx.reply('Жми кнопку ниже 👇', keyboard)
})

// Launch bot
async function bootstrap() {
  try {
    // Delete webhook to ensure clean state
    await bot.telegram.deleteWebhook({ drop_pending_updates: true })
    
    // Small delay after webhook deletion
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Launch bot with dropPendingUpdates
    await bot.launch({ dropPendingUpdates: true })
    
    console.log('🤖 ASKED Store Bot is running')
    console.log('📱 Bot is ready to receive messages')
    console.log('✅ Version: v0.3.0')
  } catch (error) {
    console.error('❌ Failed to start bot:', error)
    process.exit(1)
  }
}

bootstrap()

// Enable graceful stop
process.once('SIGINT', () => {
  try {
    bot.stop('SIGINT')
  } catch (error) {
    console.error('Error stopping bot:', error)
  }
  process.exit(0)
})

process.once('SIGTERM', () => {
  try {
    bot.stop('SIGTERM')
  } catch (error) {
    console.error('Error stopping bot:', error)
  }
  process.exit(0)
})
