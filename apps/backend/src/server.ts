import express from 'express'
import cors from 'cors'
import ordersRouter from './routes/orders.js'
import promosRouter from './routes/promos.js'
import settingsRouter from './routes/settings.js'
import telegramRouter from './routes/telegram.js'
import authRouter from './routes/auth.js'
import publicLabRouter from './routes/publicLabRoutes.js'
import publicProductsRouter from './routes/public/products.js'
import publicCategoriesRouter from './routes/public/categories.js'
import bannersRouter from './routes/banners.js'
import { adminOnly } from './middleware/adminOnly.js'
import adminOrdersRouter from './routes/admin/orders.js'
import adminNotificationsRouter from './routes/admin/notifications.js'
import adminProductsRouter from './routes/admin/products.js'
import adminCategoriesRouter from './routes/admin/categories.js'
import adminPromosRouter from './routes/admin/promos.js'
import adminAdminsRouter from './routes/admin/admins.js'
import adminStatsRouter from './routes/admin/stats.js'
import adminSettingsRouter from './routes/admin/settings.js'
import adminBannersRouter from './routes/admin/banners.js'
import adminLabRouter from './routes/adminLabRoutes.js'
import adminTelegramRouter from './routes/admin/telegram.js'
import adminTelegramSubscribersRouter from './routes/admin/telegramSubscribers.js'
import adminBotFlowsRouter from './routes/admin/botFlows.js'
import adminBotFlowsExtendedRouter from './routes/admin/botFlowsExtended.js'
import adminBotPreviewRouter from './routes/admin/botPreview.js'
import { errorHandler } from './middleware/errorHandler.js'
import { prisma } from './db/prisma.js'

const app = express()
const PORT = Number(process.env.PORT || 4000)

// Validate notification environment variables at startup
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const ADMIN_IDS = process.env.TELEGRAM_ADMIN_IDS

if (!BOT_TOKEN) {
  console.warn('[STARTUP] ⚠️  TELEGRAM_BOT_TOKEN not set - admin notifications will be disabled')
}

if (!ADMIN_IDS) {
  console.warn('[STARTUP] ⚠️  TELEGRAM_ADMIN_IDS not set - admin notifications will be disabled')
} else {
  const adminIds = ADMIN_IDS.split(',').map(id => id.trim()).filter(id => id.length > 0)
  console.log(`[STARTUP] ✅ Admin notifications configured for ${adminIds.length} admin(s)`)
}

// CORS configuration
const frontendUrl = process.env.FRONTEND_URL || '*'
const allowedOrigins = frontendUrl.includes(',') 
  ? frontendUrl.split(',').map(url => url.trim())
  : [frontendUrl]

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-tg-id'],
}))

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Health check endpoints
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    version: '1.16.4',
    message: 'ASKED Store Backend is running'
  })
})

app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})

// Routes placeholder
app.get('/', (req, res) => {
  res.json({ 
    message: 'ASKED Store API',
    version: '1.16.4',
    changelog: 'Backend: LAB API (artists + labProducts), admin CRUD + public endpoints'
  })
})

// Public APIs
app.use('/api/orders', ordersRouter)
app.use('/api/promos', promosRouter)
app.use('/api/settings', settingsRouter)
app.use('/api/telegram', telegramRouter)
app.use('/api/auth', authRouter)
app.use('/api/lab', publicLabRouter)
app.use('/api/public/products', publicProductsRouter)
app.use('/api/public/categories', publicCategoriesRouter)
app.use('/api/banners', bannersRouter)

// Health check endpoints (public, for monitoring)
app.get('/health/db', async (req, res) => {
  try {
    const serviceName = process.env.RENDER_SERVICE_NAME || process.env.SERVICE_NAME || 'unknown'
    
    // Extract DB info (mask password)
    let dbHost = 'unknown'
    let dbName = 'unknown'
    try {
      const dbUrl = process.env.DATABASE_URL || ''
      if (dbUrl) {
        const url = new URL(dbUrl)
        dbHost = url.hostname
        dbName = url.pathname.replace(/^\//, '').split('?')[0]
      }
    } catch (e) {
      // Ignore
    }

    // Get order count and last order
    const orderCount = await prisma.order.count()
    const lastOrder = await prisma.order.findFirst({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        status: true,
        total: true,
        tgId: true,
        createdAt: true,
      },
    })

    res.json({
      ok: true,
      service: serviceName,
      db: {
        host: dbHost,
        name: dbName,
        url: `${dbHost}/${dbName}`, // Masked URL
      },
      timestamp: new Date().toISOString(),
      countOrders: orderCount,
      lastOrderId: lastOrder?.id || null,
      lastOrderCreatedAt: lastOrder?.createdAt.toISOString() || null,
      lastOrder: lastOrder ? {
        id: lastOrder.id,
        status: lastOrder.status,
        total: lastOrder.total,
        tgId: lastOrder.tgId ? String(lastOrder.tgId) : null,
        createdAt: lastOrder.createdAt.toISOString(),
      } : null,
    })
  } catch (error: any) {
    console.error('[HEALTH/DB] Error:', error)
    res.status(500).json({
      ok: false,
      error: 'Database health check failed',
      message: error.message,
    })
  }
})

// Debug endpoint for recent orders (admin only, or remove in production)
app.get('/debug/orders/recent', adminOnly, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20
    const orders = await prisma.order.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        status: true,
        total: true,
        tgId: true,
        createdAt: true,
        notifyUserStatus: true,
      },
    })

    res.json({
      count: orders.length,
      orders: orders.map(o => ({
        id: o.id,
        status: o.status,
        total: o.total,
        tgId: o.tgId ? String(o.tgId) : null,
        createdAt: o.createdAt.toISOString(),
        notifyUserStatus: o.notifyUserStatus,
      })),
    })
  } catch (error: any) {
    console.error('[DEBUG/ORDERS] Error:', error)
    res.status(500).json({ error: 'Failed to fetch recent orders', message: error.message })
  }
})

// Admin APIs (protected with adminOnly middleware)
app.use('/api/admin/orders', adminOnly, adminOrdersRouter)
app.use('/api/admin/notifications', adminOnly, adminNotificationsRouter)
app.use('/api/admin/products', adminOnly, adminProductsRouter)
app.use('/api/admin/categories', adminOnly, adminCategoriesRouter)
app.use('/api/admin/promos', adminOnly, adminPromosRouter)
app.use('/api/admin/admins', adminOnly, adminAdminsRouter)
app.use('/api/admin/stats', adminOnly, adminStatsRouter)
app.use('/api/admin/settings', adminOnly, adminSettingsRouter)
app.use('/api/admin/banners', adminOnly, adminBannersRouter)
app.use('/api/admin/lab', adminOnly, adminLabRouter)
app.use('/api/admin/telegram', adminOnly, adminTelegramRouter)
app.use('/api/admin/telegram/subscribers', adminOnly, adminTelegramSubscribersRouter)
app.use('/api/admin/bot/flows', adminOnly, adminBotFlowsExtendedRouter) // Extended endpoints (must be first)
app.use('/api/admin/bot/flows', adminOnly, adminBotFlowsRouter) // Legacy endpoints
app.use('/api/admin/bot/preview', adminOnly, adminBotPreviewRouter)

// Error handler (должен быть последним middleware)
app.use(errorHandler)

// Remove LAB seed - now using Prisma
// LAB data should be managed through admin API

const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
  console.log(`📡 Health check: http://localhost:${PORT}/health`)
  console.log(`📦 Orders API: http://localhost:${PORT}/api/orders`)
  console.log(`🔐 Admin API: http://localhost:${PORT}/api/admin/*`)
  console.log(`🧪 LAB API: http://localhost:${PORT}/api/lab/*`)
})

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  console.log(`\n${signal} received. Starting graceful shutdown...`)
  
  server.close(async () => {
    console.log('HTTP server closed')
    
    try {
      await prisma.$disconnect()
      console.log('Database connection closed')
      process.exit(0)
    } catch (error) {
      console.error('Error during shutdown:', error)
      process.exit(1)
    }
  })
  
  // Force close after 10 seconds
  setTimeout(() => {
    console.error('Forced shutdown after timeout')
    process.exit(1)
  }, 10000)
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
process.on('SIGINT', () => gracefulShutdown('SIGINT'))





