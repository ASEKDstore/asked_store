import express from 'express'
import cors from 'cors'
import ordersRouter from './routes/orders.js'
import promosRouter from './routes/promos.js'
import settingsRouter from './routes/settings.js'
import telegramRouter from './routes/telegram.js'
import publicLabRouter from './routes/publicLabRoutes.js'
import { requireAdmin } from './middleware/requireAdmin.js'
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
import { seedIfEmpty } from './store/labStore.js'
import { errorHandler } from './middleware/errorHandler.js'

const app = express()
const PORT = Number(process.env.PORT || 4000)

app.use(cors())
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
app.use('/api/lab', publicLabRouter)

// Admin APIs (protected)
app.use('/api/admin/orders', requireAdmin, adminOrdersRouter)
app.use('/api/admin/products', requireAdmin, adminProductsRouter)
app.use('/api/admin/promos', requireAdmin, adminPromosRouter)
app.use('/api/admin/admins', requireAdmin, adminAdminsRouter)
app.use('/api/admin/stats', requireAdmin, adminStatsRouter)
app.use('/api/admin/settings', requireAdmin, adminSettingsRouter)
app.use('/api/admin/banners', requireAdmin, adminBannersRouter)
app.use('/api/admin/lab', requireAdmin, adminLabRouter)
app.use('/api/admin/telegram', requireAdmin, adminTelegramRouter)
app.use('/api/admin/telegram/subscribers', requireAdmin, adminTelegramSubscribersRouter)
app.use('/api/admin/bot/flows', requireAdmin, adminBotFlowsRouter)

// Error handler (должен быть последним middleware)
app.use(errorHandler)

// Seed LAB data if empty (dev mode)
if (process.env.NODE_ENV !== 'production') {
  seedIfEmpty().catch(err => {
    console.error('Failed to seed LAB data:', err)
  })
}

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
  console.log(`📡 Health check: http://localhost:${PORT}/health`)
  console.log(`📦 Orders API: http://localhost:${PORT}/api/orders`)
  console.log(`🔐 Admin API: http://localhost:${PORT}/api/admin/*`)
  console.log(`🧪 LAB API: http://localhost:${PORT}/api/lab/*`)
})





