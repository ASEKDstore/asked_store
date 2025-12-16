/**
 * Configuration module for reading environment variables
 */

import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load .env file from the bot directory
dotenv.config({ path: join(__dirname, '../.env') })

// Get bot token from environment variables (unified source)
const botToken = (process.env.BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN || '').trim()

if (!botToken) {
  console.error('❌ BOT_TOKEN or TELEGRAM_BOT_TOKEN is not set in environment variables')
  console.error('❌ Please set BOT_TOKEN or TELEGRAM_BOT_TOKEN in your environment')
  process.exit(1)
}

// Get webapp URL from environment variables with fallback
const webappUrl = (process.env.WEBAPP_URL || process.env.FRONTEND_URL || 'https://asked-store-frontend.onrender.com/').trim()

if (!webappUrl) {
  console.error('❌ WEBAPP_URL is not set in environment variables')
  console.error('❌ Mini App requires WEBAPP_URL to work correctly')
  process.exit(1)
}

export const config = {
  botToken: botToken,
  telegramChannelUrl: process.env.TELEGRAM_CHANNEL_URL || 'https://t.me/asked_store',
  backendUrl: process.env.BACKEND_URL || 'http://localhost:4000',
  webappUrl: webappUrl,
}


