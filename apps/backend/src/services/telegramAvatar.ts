/**
 * Service for fetching user avatar from Telegram Bot API
 */

const TELEGRAM_API_URL = 'https://api.telegram.org/bot'

/**
 * Get user avatar URL from Telegram Bot API
 * @param botToken - Telegram bot token
 * @param telegramId - User Telegram ID
 * @returns Avatar URL or null if not available
 */
export async function getUserAvatarUrl(
  botToken: string,
  telegramId: number
): Promise<string | null> {
  try {
    // Get user profile photos
    const photosResponse = await fetch(
      `${TELEGRAM_API_URL}${botToken}/getUserProfilePhotos?user_id=${telegramId}&limit=1`
    )

    if (!photosResponse.ok) {
      return null
    }

    const photosData = await photosResponse.json()

    if (!photosData.ok || !photosData.result?.photos?.[0]?.[0]?.file_id) {
      return null
    }

    const fileId = photosData.result.photos[0][0].file_id

    // Get file path
    const fileResponse = await fetch(
      `${TELEGRAM_API_URL}${botToken}/getFile?file_id=${fileId}`
    )

    if (!fileResponse.ok) {
      return null
    }

    const fileData = await fileResponse.json()

    if (!fileData.ok || !fileData.result?.file_path) {
      return null
    }

    // Construct avatar URL
    const avatarUrl = `https://api.telegram.org/file/bot${botToken}/${fileData.result.file_path}`

    return avatarUrl
  } catch (error) {
    console.error('[getUserAvatarUrl] Error:', error)
    return null
  }
}

