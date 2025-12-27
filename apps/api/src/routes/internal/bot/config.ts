// Internal bot config endpoint

import { Router, Request, Response } from 'express'
import { prisma } from '../../../prisma.js'
import type { BotConfigDTO, ChannelConfigDTO } from '@asked-store/shared'

const router = Router()

/**
 * Internal Bot Config Response DTO
 */
interface InternalBotConfigResponseDTO {
  bot: BotConfigDTO
  channel: ChannelConfigDTO
  allowedOps: string[] // Allowed operations (e.g., ['read', 'write'])
}

/**
 * GET /internal/bot/config
 * Get bot and channel configuration from settings
 * Requires: Internal service authentication (INTERNAL_SERVICE_TOKEN)
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    // Fetch bot config from settings
    const botConfigSetting = await prisma.settings.findUnique({
      where: { key: 'bot.config' },
    })

    // Fetch channel config from settings
    const channelConfigSetting = await prisma.settings.findUnique({
      where: { key: 'channel.config' },
    })

    if (!botConfigSetting) {
      res.status(404).json({ error: 'Bot configuration not found' })
      return
    }

    if (!channelConfigSetting) {
      res.status(404).json({ error: 'Channel configuration not found' })
      return
    }

    // Validate config structures
    const botConfig = botConfigSetting.value as unknown as BotConfigDTO
    const channelConfig = channelConfigSetting.value as unknown as ChannelConfigDTO

    // Build response with allowed operations
    const response: InternalBotConfigResponseDTO = {
      bot: botConfig,
      channel: channelConfig,
      allowedOps: ['read', 'write'], // Bot is allowed to read and write
    }

    res.json(response)
  } catch (error) {
    console.error('Error fetching bot config:', error)
    res.status(500).json({ error: 'Failed to fetch bot configuration' })
  }
})

export { router as botConfigRouter }

