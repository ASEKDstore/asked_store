// Public settings endpoint (read-only, limited keys)

import { Router, Request, Response } from 'express'
import { prisma } from '../../prisma.js'
import type { PublicSettingsDTO } from '@asked-store/shared'
import { PUBLIC_SETTINGS_KEYS } from '../admin/settings.js'

const router = Router()

/**
 * GET /public/settings
 * Get public settings (only whitelisted keys)
 * No authentication required
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    // Fetch only whitelisted keys
    const settings = await prisma.settings.findMany({
      where: {
        key: {
          in: PUBLIC_SETTINGS_KEYS as readonly string[],
        },
      },
    })

    // Build public settings object
    const publicSettings: PublicSettingsDTO = {}
    for (const setting of settings) {
      const key = setting.key as keyof PublicSettingsDTO
      if (PUBLIC_SETTINGS_KEYS.includes(setting.key as any)) {
        publicSettings[key] = setting.value as unknown
      }
    }

    res.json(publicSettings)
  } catch (error) {
    console.error('Error fetching public settings:', error)
    res.status(500).json({ error: 'Failed to fetch public settings' })
  }
})

export { router as publicSettingsRouter }

