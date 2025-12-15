import { Telegraf } from 'telegraf'
import { config } from './config.js'
import { handleStart, handleStore } from './handlers/start.js'
import { MenuActions, handleMyOrders, handleAskedLab, handleOpenApp } from './handlers/menu.js'
import { emojiCaptureMiddleware } from './tools/emojiCapture.js'

// Create bot instance
const bot = new Telegraf(config.botToken)

// Register emoji capture middleware (only if EMOJI_CAPTURE=1)
if (process.env.EMOJI_CAPTURE === '1') {
  bot.use(emojiCaptureMiddleware)
  console.log('📸 Emoji capture mode enabled')
}

// Register /start command handler (always sends web_app button)
bot.start(handleStart)

// Register /store command handler (sends web_app button if user lost it)
bot.command('store', handleStore)

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

