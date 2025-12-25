/**
 * Configuration module for reading environment variables
 */

const botToken = process.env.TELEGRAM_BOT_TOKEN || process.env.BOT_TOKEN || ''

if (!botToken) {
  console.error('❌ TELEGRAM_BOT_TOKEN or BOT_TOKEN is not set in environment variables')
  process.exit(1)
}

const webappUrl = process.env.WEBAPP_URL || ''

if (!webappUrl) {
  console.warn('⚠️ WEBAPP_URL is not set - webapp button will not work')
}

export const config = {
  botToken: botToken.trim(),
  webappUrl: webappUrl.trim(),
}
