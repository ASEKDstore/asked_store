/**
 * Configuration module for reading environment variables
 * Uses only process.env (no .env files in production)
 */

// Load .env file ONLY in development (not on Render)
// On Render, all env vars come from process.env, so dotenv is not needed
// Note: dotenv loading is skipped in production - Render provides env vars directly
if (process.env.NODE_ENV !== 'production') {
  // Try to load dotenv synchronously if available (for local development)
  // If dotenv is not available or fails, continue - process.env will be used
  try {
    // Use createRequire for ESM compatibility
    const { createRequire } = await import('module')
    const require = createRequire(import.meta.url)
    const dotenv = require('dotenv')
    const { fileURLToPath } = await import('url')
    const { dirname, join } = await import('path')
    
    const __filename = fileURLToPath(import.meta.url)
    const __dirname = dirname(__filename)
    dotenv.config({ path: join(__dirname, '../.env') })
  } catch (error) {
    // dotenv is optional, ignore if not available
    // This is fine - in production we use process.env directly
  }
}

/**
 * Get required environment variable with fallback
 * If value is empty, logs available env keys and exits
 */
function getRequiredEnv(key: string, fallback?: string): string {
  const value = (process.env[key] || fallback || '').trim()
  
  if (!value) {
    console.error(`❌ ${key} is not set in environment variables`)
    console.error('❌ Available environment variable keys:')
    const envKeys = Object.keys(process.env).sort()
    console.error(`   ${envKeys.join(', ')}`)
    console.error(`\n❌ Required: ${key}${fallback ? ` or ${fallback}` : ''}`)
    process.exit(1)
  }
  
  return value
}

// Get bot token from environment variables (unified source)
const botToken = process.env.BOT_TOKEN ?? process.env.TELEGRAM_BOT_TOKEN ?? ''

if (!botToken) {
  console.error('❌ BOT_TOKEN or TELEGRAM_BOT_TOKEN is not set in environment variables')
  console.error('❌ Available environment variable keys:')
  const envKeys = Object.keys(process.env).sort()
  console.error(`   ${envKeys.join(', ')}`)
  console.error('\n❌ Required: BOT_TOKEN or TELEGRAM_BOT_TOKEN')
  process.exit(1)
}

// Get webapp URL from environment variables with fallback
const webappUrl = process.env.WEBAPP_URL ?? process.env.FRONTEND_URL ?? 'https://asked-store-frontend.onrender.com/'

export const config = {
  botToken: botToken.trim(),
  telegramChannelUrl: process.env.TELEGRAM_CHANNEL_URL || 'https://t.me/asked_store',
  backendUrl: process.env.BACKEND_URL || 'http://localhost:4000',
  webappUrl: webappUrl.trim(),
  nodeEnv: process.env.NODE_ENV || 'development',
}


