import { Router } from 'express'
import { prisma } from '../../db/prisma.js'

const router = Router()

const DEFAULT_SETTINGS = {
  maintenanceMode: false,
  home: {
    showBanners: true,
    showTiles: true,
    showLab: true,
  },
}

// GET /api/admin/settings
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
    
    // Ensure home settings exist
    const value = settings.value as any
    if (!value.home) {
      value.home = DEFAULT_SETTINGS.home
      settings = await prisma.setting.update({
        where: { key: 'main' },
        data: { value },
      })
    }
    
    res.json(settings.value)
  } catch (error: any) {
    console.error('Error fetching settings:', error)
    res.status(500).json({ error: 'Failed to fetch settings' })
  }
})

// PATCH /api/admin/settings
router.patch('/', async (req, res) => {
  try {
    const { maintenanceMode, home } = req.body
    
    let settings = await prisma.setting.findUnique({
      where: { key: 'main' },
    })
    
    const currentValue = settings?.value as any || DEFAULT_SETTINGS
    const updatedValue = { ...currentValue }
    
    if (typeof maintenanceMode === 'boolean') {
      updatedValue.maintenanceMode = maintenanceMode
    }
    
    if (home && typeof home === 'object') {
      updatedValue.home = {
        showBanners: typeof home.showBanners === 'boolean' ? home.showBanners : (currentValue.home?.showBanners ?? true),
        showTiles: typeof home.showTiles === 'boolean' ? home.showTiles : (currentValue.home?.showTiles ?? true),
        showLab: typeof home.showLab === 'boolean' ? home.showLab : (currentValue.home?.showLab ?? true),
      }
    }
    
    if (!updatedValue.home) {
      updatedValue.home = DEFAULT_SETTINGS.home
    }
    
    settings = await prisma.setting.upsert({
      where: { key: 'main' },
      update: { value: updatedValue },
      create: {
        key: 'main',
        value: updatedValue,
      },
    })
    
    res.json(settings.value)
  } catch (error: any) {
    console.error('Error updating settings:', error)
    res.status(500).json({ error: 'Failed to update settings' })
  }
})

export default router
