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

const BOT_TOKEN = process.env.BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN

if (!BOT_TOKEN) {
  console.error('❌ BOT_TOKEN or TELEGRAM_BOT_TOKEN is not set in environment variables')
  process.exit(1)
}

export const config = {
  botToken: BOT_TOKEN,
  telegramChannelUrl: process.env.TELEGRAM_CHANNEL_URL || 'https://t.me/asked_store',
  backendUrl: process.env.BACKEND_URL || 'http://localhost:4000',
}


