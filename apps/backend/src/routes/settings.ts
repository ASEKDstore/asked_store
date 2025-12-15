import { Router } from 'express'
import { readJson, writeJson } from '../store/jsonDb.js'
import type { Settings } from '../types/settings.js'

const router = Router()

// GET /api/settings
router.get('/', async (req, res) => {
  try {
    const settings = await readJson<Settings>('settings')
    if (!settings) {
      const defaultSettings: Settings = { maintenanceMode: false }
      await writeJson('settings', defaultSettings)
      return res.json(defaultSettings)
    }
    res.json(settings)
  } catch (error: any) {
    console.error('Error fetching settings:', error)
    res.status(500).json({ error: 'Failed to fetch settings' })
  }
})

export default router



