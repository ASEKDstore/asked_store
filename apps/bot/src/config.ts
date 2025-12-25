/**
 * Configuration module for reading environment variables
 * Uses only process.env (no .env files in production)
 * 
 * Note: In production (Render), all env vars come from process.env
 * For local development, set environment variables directly or use a tool like dotenv-cli
 */

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
const webappUrl = process.env.WEBAPP_URL || 'https://asked-store-frontend.onrender.com/?v=1.16.4'

export const config = {
  botToken: botToken.trim(),
  telegramChannelUrl: process.env.TELEGRAM_CHANNEL_URL || 'https://t.me/asked_store',
  backendUrl: process.env.BACKEND_URL || 'http://localhost:4000',
  webappUrl: webappUrl.trim(),
  nodeEnv: process.env.NODE_ENV || 'development',
}


