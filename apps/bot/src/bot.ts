import { Telegraf, Markup } from 'telegraf'

// Load dotenv only in development (not in production on Render)
// On Render, all env vars come from process.env, so dotenv is not needed
// Note: Using dynamic import to avoid top-level await issues
if (process.env.NODE_ENV !== 'production') {
  // Load dotenv asynchronously (non-blocking)
  import('dotenv/config').catch(() => {
    // dotenv is optional, ignore if not available
  })
}

/* =========================
   🔐 ENV VALIDATION
========================= */

const BOT_TOKEN =
  process.env.BOT_TOKEN ||
  process.env.TELEGRAM_BOT_TOKEN

if (!BOT_TOKEN) {
  console.error('❌ BOT_TOKEN / TELEGRAM_BOT_TOKEN NOT FOUND')
  console.error('❌ ENV KEYS:', Object.keys(process.env).sort().join(', '))
  process.exit(1)
}

const WEBAPP_URL = process.env.WEBAPP_URL || 'https://asked-store-frontend.onrender.com'

console.log('🚀 STARTING ASKED BOT')
console.log('🧩 SERVICE:', process.env.RENDER_SERVICE_NAME, process.env.RENDER_SERVICE_ID)
console.log('🔐 BOT_TOKEN PRESENT:', BOT_TOKEN.length > 10)
console.log('🌐 WEBAPP_URL:', WEBAPP_URL)

/* =========================
   🤖 BOT INIT
========================= */

const bot = new Telegraf(BOT_TOKEN)

/* =========================
   📩 MIDDLEWARE
========================= */

bot.use(async (ctx, next) => {
  const type = ctx.updateType
  const text =
    (ctx.message as any)?.text ||
    (ctx.callbackQuery as any)?.data ||
    '—'
  console.log(`[UPDATE] ${type}: ${text}`)
  return next()
})

/* =========================
   ▶️ COMMANDS
========================= */

bot.start(async (ctx) => {
  await ctx.reply(
    'Добро пожаловать в ASKED 🖤\n\nОткрывай магазин кнопкой ниже 👇',
    Markup.keyboard([
      [Markup.button.webApp('🛍 Открыть ASKED Store', WEBAPP_URL)],
    ]).resize()
  )
})

bot.command('store', async (ctx) => {
  await ctx.reply(
    'Жми кнопку ниже 👇',
    Markup.keyboard([
      [Markup.button.webApp('🛍 Открыть ASKED Store', WEBAPP_URL)],
    ]).resize()
  )
})

/* =========================
   🚀 BOOTSTRAP
========================= */

async function startBot() {
  console.log('🧹 Deleting webhook (safety)')
  try {
    await bot.telegram.deleteWebhook({ drop_pending_updates: true })
  } catch {
    // ignore
  }

  console.log('🤖 Launching bot (polling)')
  await bot.launch({ dropPendingUpdates: true })

  console.log('✅ BOT STARTED SUCCESSFULLY')
}

startBot().catch((err) => {
  console.error('❌ BOT CRASHED:', err)
  process.exit(1)
})

/* =========================
   🛑 GRACEFUL SHUTDOWN
========================= */

process.once('SIGINT', () => {
  console.log('🛑 SIGINT')
  bot.stop('SIGINT')
  process.exit(0)
})

process.once('SIGTERM', () => {
  console.log('🛑 SIGTERM')
  bot.stop('SIGTERM')
  process.exit(0)
})
