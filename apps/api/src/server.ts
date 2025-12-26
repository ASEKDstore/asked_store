// Main Express server

import express from 'express'
import cors from 'cors'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { errorHandler } from './middleware/errorHandler.js'
import { healthRouter } from './routes/health.js'
import { readyRouter } from './routes/ready.js'
import { authRouter } from './routes/auth.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Get version from package.json
function getVersion(): string {
  try {
    // Try root package.json first, then apps/api/package.json
    const rootPackagePath = join(__dirname, '../../../../package.json')
    const localPackagePath = join(__dirname, '../../package.json')
    
    try {
      const packageJson = JSON.parse(readFileSync(rootPackagePath, 'utf-8'))
      return packageJson.version || 'unknown'
    } catch {
      const packageJson = JSON.parse(readFileSync(localPackagePath, 'utf-8'))
      return packageJson.version || 'unknown'
    }
  } catch {
    return 'unknown'
  }
}

// Get commit SHA from environment or git
function getCommitSha(): string {
  // Check common environment variables (Render, etc.)
  return (
    process.env.RENDER_GIT_COMMIT ||
    process.env.GIT_COMMIT ||
    process.env.COMMIT_SHA ||
    process.env.VERCEL_GIT_COMMIT_SHA ||
    'unknown'
  )
}

// Log startup information
function logStartupInfo() {
  const version = getVersion()
  const commitSha = getCommitSha()
  const env = process.env.NODE_ENV || 'development'
  const port = process.env.PORT || 4000

  console.log('🚀 ASKED Store API Server')
  console.log(`   Version: ${version}`)
  console.log(`   Commit: ${commitSha}`)
  console.log(`   Environment: ${env}`)
  console.log(`   Port: ${port}`)
}

const app = express()

// CORS configuration
const corsOrigins = process.env.CORS_ORIGINS?.split(',').map((s) => s.trim()) || ['*']
app.use(
  cors({
    origin: corsOrigins.includes('*') ? true : corsOrigins,
    credentials: true,
  })
)

// Body parser
app.use(express.json())

// Routes
app.use('/health', healthRouter)
app.use('/ready', readyRouter)
app.use('/auth', authRouter)

// Error handler (must be last)
app.use(errorHandler)

const PORT = process.env.PORT || 4000

app.listen(PORT, () => {
  logStartupInfo()
  console.log(`📡 CORS origins: ${corsOrigins.join(', ')}`)
})

// Graceful shutdown
process.on('SIGTERM', async () => {
  const { prisma } = await import('./prisma.js')
  await prisma.$disconnect()
  process.exit(0)
})

