import express from 'express'
import cors from 'cors'
import ordersRouter from './routes/orders.js'
import promosRouter from './routes/promos.js'
import settingsRouter from './routes/settings.js'
import telegramRouter from './routes/telegram.js'
import authRouter from './routes/auth.js'
import publicLabRouter from './routes/publicLabRoutes.js'
import { adminOnly } from './middleware/adminOnly.js'
import adminOrdersRouter from './routes/admin/orders.js'
import adminProductsRouter from './routes/admin/products.js'
import adminPromosRouter from './routes/admin/promos.js'
import adminAdminsRouter from './routes/admin/admins.js'
import adminStatsRouter from './routes/admin/stats.js'
import adminSettingsRouter from './routes/admin/settings.js'
import adminBannersRouter from './routes/admin/banners.js'
import adminLabRouter from './routes/adminLabRoutes.js'
import adminTelegramRouter from './routes/admin/telegram.js'
import adminTelegramSubscribersRouter from './routes/admin/telegramSubscribers.js'
import adminBotFlowsRouter from './routes/admin/botFlows.js'
import { errorHandler } from './middleware/errorHandler.js'
import { prisma } from './db/prisma.js'

const app = express()
const PORT = Number(process.env.PORT || 4000)

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
    version: '1.16.1',
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
    version: '1.16.1',
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

// Admin APIs (protected with adminOnly middleware)
app.use('/api/admin/orders', adminOnly, adminOrdersRouter)
app.use('/api/admin/products', adminOnly, adminProductsRouter)
app.use('/api/admin/promos', adminOnly, adminPromosRouter)
app.use('/api/admin/admins', adminOnly, adminAdminsRouter)
app.use('/api/admin/stats', adminOnly, adminStatsRouter)
app.use('/api/admin/settings', adminOnly, adminSettingsRouter)
app.use('/api/admin/banners', adminOnly, adminBannersRouter)
app.use('/api/admin/lab', adminOnly, adminLabRouter)
app.use('/api/admin/telegram', adminOnly, adminTelegramRouter)
app.use('/api/admin/telegram/subscribers', adminOnly, adminTelegramSubscribersRouter)
app.use('/api/admin/bot/flows', adminOnly, adminBotFlowsRouter)

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





