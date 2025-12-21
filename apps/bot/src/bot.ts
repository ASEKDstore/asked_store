import { Telegraf } from 'telegraf'
import { config } from './config.js'
import { handleStart } from './handlers/start.js'


import { handleStartV2, handleFlowCallbackV2, handleFlowTextV2 } from './handlers/flowHandlerV2.js'
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

// Register /start command handler (V2 with new FlowEngine)
// Falls back to V1 if V2 fails
bot.start(async (ctx) => {
  try {
    await handleStartV2(ctx)
  } catch (error) {
    console.warn('[BOT] V2 handler failed, falling back to V1:', error)
    await handleStart(ctx)
  }
})

// Register flow callback handler (V2)
bot.on('callback_query', async (ctx) => {
  const data = (ctx.callbackQuery as any)?.data
  if (data && typeof data === 'string' && data.startsWith('flow:')) {
    try {
      await handleFlowCallbackV2(ctx)
    } catch (error) {
      console.warn('[BOT] V2 callback handler failed, falling back to V1:', error)
      // Removed: V2 only
    }
  }
})

// Register text handler for flow input (V2)
bot.on('text', async (ctx) => {
  try {
    await handleFlowTextV2(ctx)
  } catch (error) {
    // Silently fail - text handler is optional
    console.warn('[BOT] V2 text handler failed:', error)
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
bot.launch().then(async () => {
  console.log('🤖 ASKED Store Bot is running')
  console.log('📱 Bot is ready to receive messages')
  console.log('✅ Version: v0.3.0')
  
  // Set menu button with WebApp URL
  if (config.webappUrl) {
    try {
      await bot.telegram.setChatMenuButton({
        menu_button: {
          type: 'web_app',
          text: '🛍 ASKED Store',
          web_app: {
            url: config.webappUrl,
          },
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

