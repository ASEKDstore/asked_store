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
  
  // Aggressively delete webhook multiple times to prevent 409 Conflict errors
  // This ensures we use polling instead of webhook mode
  for (let i = 0; i < 3; i++) {
    try {
      await bot.telegram.deleteWebhook({ drop_pending_updates: true })
      console.log(`✅ Webhook deletion attempt ${i + 1}/3 successful`)
      
      // Wait longer to ensure webhook is fully removed
      await new Promise(resolve => setTimeout(resolve, 2000))
    } catch (error: unknown) {
      // Ignore errors if webhook doesn't exist
      const err = error as { response?: { error_code?: number }; message?: string }
      if (err.response?.error_code !== 404) {
        console.warn(`⚠️ Warning: Failed to delete webhook (attempt ${i + 1}/3):`, err.message || String(error))
      }
    }
  }
  
  // Verify webhook is deleted and wait longer
  let webhookDeleted = false
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const webhookInfo = await bot.telegram.getWebhookInfo()
      if (!webhookInfo.url) {
        console.log('✅ Verified: No webhook is set')
        webhookDeleted = true
        break
      } else {
        console.warn(`⚠️ Webhook still exists (attempt ${attempt + 1}/5): ${webhookInfo.url}, deleting...`)
        await bot.telegram.deleteWebhook({ drop_pending_updates: true })
        await new Promise(resolve => setTimeout(resolve, 5000)) // Wait 5 seconds
      }
    } catch (error: unknown) {
      console.warn(`⚠️ Could not verify webhook status (attempt ${attempt + 1}/5):`, error)
      await new Promise(resolve => setTimeout(resolve, 3000))
    }
  }
  
  if (!webhookDeleted) {
    console.warn('⚠️ Could not fully remove webhook, but proceeding anyway...')
  }
  
  // Additional wait before launching to ensure Telegram API is ready
  console.log('⏳ Waiting 5 seconds before launch to ensure API is ready...')
  await new Promise(resolve => setTimeout(resolve, 5000))

  // Retry logic for bot launch (in case of 409 Conflict)
  let retries = 5
  let lastError: unknown = null
  
  while (retries > 0) {
    try {
      console.log(`🔄 Attempting to launch bot (${6 - retries}/5)...`)
      
      // Launch bot with polling
      await bot.launch({
        dropPendingUpdates: true,
        allowedUpdates: [], // Allow all update types
      })

      console.log('🤖 ASKED Store Bot is running')
      console.log('📱 Bot is ready to receive messages')
      console.log(`🌐 WebApp URL: ${config.webappUrl}`)
      console.log('✅ Version: v0.3.0')
      console.log('✅ Bot started successfully')
      return // Success, exit function
    } catch (error: unknown) {
      lastError = error
      const err = error as { response?: { error_code?: number }; description?: string }
      
      // If it's a 409 Conflict, retry after delay
      if (err.response?.error_code === 409) {
        retries--
        if (retries > 0) {
          const delay = (6 - retries) * 5000 // 5s, 10s, 15s, 20s, 25s
          console.warn(`⚠️ 409 Conflict detected. Retrying in ${delay}ms... (${retries} attempts left)`)
          console.warn('⚠️ This usually means another bot instance is running. Make sure only one instance is active.')
          await new Promise(resolve => setTimeout(resolve, delay))
          
          // Aggressively delete webhook again before retry
          for (let i = 0; i < 3; i++) {
            try {
              await bot.telegram.deleteWebhook({ drop_pending_updates: true })
              console.log(`🔄 Webhook deletion before retry ${i + 1}/3`)
              await new Promise(resolve => setTimeout(resolve, 3000))
            } catch {
              // Ignore errors
            }
          }
          
          // Verify webhook is deleted before retry
          try {
            const webhookInfo = await bot.telegram.getWebhookInfo()
            if (webhookInfo.url) {
              console.warn(`⚠️ Webhook still exists before retry: ${webhookInfo.url}`)
            }
          } catch {
            // Ignore
          }
        }
      } else {
        // Not a 409 error, throw immediately
        throw error
      }
    }
  }
  
  // All retries exhausted
  throw lastError
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

