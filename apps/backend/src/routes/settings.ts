import { Router } from 'express'
import { prisma } from '../db/prisma.js'

const router = Router()

const DEFAULT_SETTINGS = {
  maintenanceMode: false,
}

// GET /api/settings
router.get('/', async (req, res) => {
  try {
    let settings = await prisma.setting.findUnique({
      where: { key: 'main' },
    })
    
    if (!settings) {
      settings = await prisma.setting.create({
        data: {
          key: 'main',
          value: DEFAULT_SETTINGS,
        },
      })
    }
    
    res.json(settings.value)
  } catch (error: any) {
    console.error('Error fetching settings:', error)
    res.status(500).json({ error: 'Failed to fetch settings' })
  }
})

export default router
