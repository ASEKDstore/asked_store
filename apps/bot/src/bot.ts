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
    // Reply with ReplyKeyboard containing web_app button
    await ctx.reply(
      'Добро пожаловать в ASKED 🖤\n\nОткрывай магазин кнопкой ниже — так Telegram корректно передаст WebApp-контекст.',
      Markup.keyboard([
        [Markup.button.webApp('🛍 Открыть ASKED Store', config.webappUrl)],
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
        [Markup.button.webApp('🛍 Открыть ASKED Store', config.webappUrl)],
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

/**
 * Bootstrap function to start the bot
 * Handles webhook cleanup and error handling
 * @returns Promise<void>
 */
async function bootstrap(): Promise<void> {
  console.log('🚀 Starting ASKED Store Bot...')
  
  // Delete webhook before starting polling
  try {
    await bot.telegram.deleteWebhook({ drop_pending_updates: true })
    console.log('✅ Webhook deleted (if existed)')
  } catch (error: unknown) {
    // Ignore errors if webhook doesn't exist (404) or other non-critical errors
    const err = error as { response?: { error_code?: number }; message?: string }
    if (err.response?.error_code !== 404) {
      console.warn('⚠️ Warning: Failed to delete webhook:', err.message || String(error))
    }
  }
  
  // Launch bot with polling
  try {
    await bot.launch({
      dropPendingUpdates: true,
    })

    console.log('🤖 ASKED Store Bot is running')
    console.log('📱 Bot is ready to receive messages')
    console.log(`🌐 WebApp URL: ${config.webappUrl}`)
    console.log('✅ Bot started successfully')
  } catch (error: unknown) {
    const err = error as { response?: { error_code?: number }; description?: string }
    
    // Handle 409 Conflict (another getUpdates instance is running)
    if (err.response?.error_code === 409) {
      console.error('❌ Another getUpdates instance is running.')
      console.error('❌ Stop other bot services / local processes.')
      console.error('❌ Make sure only one bot instance is active.')
      process.exit(1)
    }
    
    // Re-throw other errors
    throw error
  }
}

// Start the bot
void bootstrap().catch((err: unknown) => {
  console.error('❌ Failed to start bot:', err)
  if (err instanceof Error) {
    console.error('❌ Error details:', err.message)
    if (err.stack) {
      console.error('❌ Stack trace:', err.stack)
    }
  }
  process.exit(1)
})

// Enable graceful stop
process.once('SIGINT', () => {
  console.log('🛑 Received SIGINT, stopping bot...')
  try {
    bot.stop('SIGINT')
    console.log('✅ Bot stopped gracefully')
    process.exit(0)
  } catch (err: unknown) {
    console.error('❌ Error stopping bot:', err)
    process.exit(1)
  }
})

process.once('SIGTERM', () => {
  console.log('🛑 Received SIGTERM, stopping bot...')
  try {
    bot.stop('SIGTERM')
    console.log('✅ Bot stopped gracefully')
    process.exit(0)
  } catch (err: unknown) {
    console.error('❌ Error stopping bot:', err)
    process.exit(1)
  }
})

