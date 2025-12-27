// Telegram WebApp initData signature validation
// Based on: https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app

import crypto from 'crypto'

export interface ParsedInitData {
  user?: {
    id: string
    first_name?: string
    last_name?: string
    username?: string
    photo_url?: string
  }
  hash: string
  [key: string]: any
}

/**
 * Parse Telegram WebApp initData string
 */
export function parseInitData(initData: string): ParsedInitData {
  const params = new URLSearchParams(initData)
  const result: ParsedInitData = {
    hash: params.get('hash') || '',
  }

  for (const [key, value] of params.entries()) {
    if (key === 'hash') continue
    if (key === 'user') {
      try {
        result.user = JSON.parse(decodeURIComponent(value))
      } catch {
        // Invalid JSON, skip
      }
    } else {
      result[key] = value
    }
  }

  return result
}

/**
 * Validate Telegram WebApp initData signature
 * @param initData - Raw initData string from Telegram WebApp
 * @param botToken - Telegram bot token (from TELEGRAM_BOT_TOKEN env)
 * @returns true if signature is valid
 */
export function validateTelegramInitData(initData: string, botToken: string): boolean {
  try {
    const params = new URLSearchParams(initData)
    const hash = params.get('hash')
    if (!hash) return false

    // Remove hash from params
    params.delete('hash')

    // Sort params by key
    const dataCheckString = Array.from(params.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n')

    // Create secret key from bot token
    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(botToken)
      .digest()

    // Calculate hash
    const calculatedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex')

    return calculatedHash === hash
  } catch (error) {
    console.error('Error validating Telegram initData:', error)
    return false
  }
}

