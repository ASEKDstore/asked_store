import { Telegraf, Markup } from 'telegraf'
import { config } from './config.js'
import { MenuActions, handleMyOrders, handleAskedLab, handleOpenApp } from './handlers/menu.js'
import { emojiCaptureMiddleware } from './tools/emojiCapture.js'

// Create bot instance
const bot = new Telegraf(config.botToken)

// Middleware: Logger for ALL updates
bot.use(async (ctx, next) => {
  const updateType = ctx.updateType
  const messageText = (ctx.message as any)?.text || (ctx.callbackQuery as any)?.data || 'N/A'
  console.log(`[UPDATE] ${updateType} | text: ${messageText}`)
  return next()
})

// Register /start command handler BEFORE any scene/stage/router middleware
// This ensures /start is always handled first
bot.start(async (ctx) => {
  try {
    // Leave any active scene if exists
    if (ctx.scene && typeof ctx.scene.leave === 'function') {
      await ctx.scene.leave()
    }

    // Reply with ReplyKeyboard containing web_app button
    await ctx.reply(
      'Добро пожаловать в ASKED 🖤\n\nОткрывай магазин кнопкой ниже — так Telegram корректно передаст WebApp-контекст.',
      Markup.keyboard([
        [Markup.button.webApp('🛍 Открыть ASKED Store', process.env.WEBAPP_URL || config.webappUrl)],
      ]).resize()
    )
  } catch (error) {
    console.error('❌ Error in /start handler:', error)
    await ctx.reply('Произошла ошибка при обработке команды. Попробуйте позже.')
  }
})

// Register /store command with same web_app button
bot.command('store', async (ctx) => {
  try {
    await ctx.reply(
      'Жми кнопку ниже 👇',
      Markup.keyboard([
        [Markup.button.webApp('🛍 Открыть ASKED Store', process.env.WEBAPP_URL || config.webappUrl)],
      ]).resize()
    )
  } catch (error) {
    console.error('❌ Error in /store handler:', error)
    await ctx.reply('Произошла ошибка. Попробуйте позже.')
  }
})

// Register emoji capture middleware (only if EMOJI_CAPTURE=1)
if (process.env.EMOJI_CAPTURE === '1') {
  bot.use(emojiCaptureMiddleware)
  console.log('📸 Emoji capture mode enabled')
}

// Register menu action handlers (legacy, for backward compatibility)
bot.action(MenuActions.MY_ORDERS, handleMyOrders)
bot.action(MenuActions.ASKED_LAB, handleAskedLab)
bot.action(MenuActions.OPEN_APP, handleOpenApp)

// Launch bot
bot.launch().then(() => {
  console.log('🤖 ASKED Store Bot is running')
  console.log('📱 Bot is ready to receive messages')
  console.log(`🌐 WebApp URL: ${config.webappUrl}`)
  console.log('✅ Version: v0.3.0')
})

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))

