import { Telegraf } from 'telegraf'
import { config } from './config.js'
import { handleStart } from './handlers/start.js'
import { MenuActions, handleMyOrders, handleAskedLab, handleOpenApp } from './handlers/menu.js'
import { emojiCaptureMiddleware } from './tools/emojiCapture.js'

// Create bot instance
const bot = new Telegraf(config.botToken)

// Register emoji capture middleware (only if EMOJI_CAPTURE=1)
if (process.env.EMOJI_CAPTURE === '1') {
  bot.use(emojiCaptureMiddleware)
  console.log('📸 Emoji capture mode enabled')
}

// Register /start command handler
bot.start(handleStart)

// Register menu action handlers
bot.action(MenuActions.MY_ORDERS, handleMyOrders)
bot.action(MenuActions.ASKED_LAB, handleAskedLab)
bot.action(MenuActions.OPEN_APP, handleOpenApp)

// Launch bot
bot.launch().then(() => {
  console.log('🤖 ASKED Store Bot is running')
  console.log('📱 Bot is ready to receive messages')
  console.log('✅ Version: v0.2.1')
})

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))

