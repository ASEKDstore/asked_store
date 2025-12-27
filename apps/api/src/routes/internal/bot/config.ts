// Internal bot config endpoint

import { Router, Request, Response } from 'express'
import { prisma } from '../../../prisma.js'
import type { BotConfigDTO } from '@asked-store/shared'

const router = Router()

/**
 * GET /internal/bot/config
 * Get bot configuration from settings
 * Requires: Service authentication (SERVICE_TOKEN or SERVICE_SECRET)
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    // Fetch bot config from settings
    const botConfigSetting = await prisma.settings.findUnique({
      where: { key: 'bot.config' },
    })

    if (!botConfigSetting) {
      res.status(404).json({ error: 'Bot configuration not found' })
      return
    }

    // Validate config structure (should match BotConfigDTO)
    const config = botConfigSetting.value as unknown as BotConfigDTO

    // Return bot config
    res.json(config)
  } catch (error) {
    console.error('Error fetching bot config:', error)
    res.status(500).json({ error: 'Failed to fetch bot configuration' })
  }
})

export { router as botConfigRouter }

