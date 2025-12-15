import { Telegraf } from 'telegraf'
import { config } from './config.js'
import { handleStart } from './handlers/start.js'
import { handleStartWithFlow } from './handlers/flowHandler.js'
import { handleFlowCallback } from './handlers/flowHandler.js'
import { MenuActions, handleMyOrders, handleAskedLab, handleOpenApp, handleSubscribeNews, handleUnsubscribeNews } from './handlers/menu.js'
import { handleStop } from './handlers/subscribe.js'
import { emojiCaptureMiddleware } from './tools/emojiCapture.js'

// Create bot instance
const bot = new Telegraf(config.botToken)

// Register emoji capture middleware (only if EMOJI_CAPTURE=1)
if (process.env.EMOJI_CAPTURE === '1') {
  bot.use(emojiCaptureMiddleware)
  console.log('📸 Emoji capture mode enabled')
}

// Register /start command handler (с поддержкой flows)
bot.start(handleStartWithFlow)

// Register flow callback handler (обрабатывает callback_data вида flow:*)
bot.on('callback_query', async (ctx) => {
  const data = (ctx.callbackQuery as any)?.data
  if (data && typeof data === 'string' && data.startsWith('flow:')) {
    await handleFlowCallback(ctx)
  }
})

// Register /stop command handler
bot.command('stop', handleStop)

// Register menu action handlers
bot.action(MenuActions.MY_ORDERS, handleMyOrders)
bot.action(MenuActions.ASKED_LAB, handleAskedLab)
bot.action(MenuActions.OPEN_APP, handleOpenApp)
bot.action(MenuActions.SUBSCRIBE_NEWS, handleSubscribeNews)
bot.action(MenuActions.UNSUBSCRIBE_NEWS, handleUnsubscribeNews)

// Launch bot
bot.launch().then(() => {
  console.log('🤖 ASKED Store Bot is running')
  console.log('📱 Bot is ready to receive messages')
  console.log('✅ Version: v0.3.0')
})

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))

