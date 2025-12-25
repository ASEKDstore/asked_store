import express from 'express'
import cors from 'cors'
import { errorHandler } from './middleware/errorHandler.js'
import { healthRouter } from './routes/health.js'
import { authRouter } from './routes/auth.js'
import { meRouter } from './routes/me.js'

const app = express()

// CORS configuration
const corsOrigins = process.env.CORS_ORIGINS?.split(',') || ['*']
app.use(cors({
  origin: corsOrigins.includes('*') ? true : corsOrigins,
  credentials: true,
}))

// Body parser
app.use(express.json())

// Routes
app.use('/health', healthRouter)
app.use('/auth', authRouter)
app.use('/me', meRouter)

// Error handler (must be last)
app.use(errorHandler)

const PORT = process.env.PORT || 4000

app.listen(PORT, () => {
  console.log(`🚀 API server running on port ${PORT}`)
  console.log(`📡 CORS origins: ${corsOrigins.join(', ')}`)
})

// Graceful shutdown
process.on('SIGTERM', async () => {
  const { prisma } = await import('./prisma.js')
  await prisma.$disconnect()
  process.exit(0)
})
