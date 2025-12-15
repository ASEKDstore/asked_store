import { Router } from 'express'
import { readJson, writeJson } from '../../store/jsonDb.js'
import type { Settings } from '../../types/settings.js'

const router = Router()

// GET /api/admin/settings
router.get('/', async (req, res) => {
  try {
    const settings = await readJson<Settings>('settings')
    if (!settings) {
      const defaultSettings: Settings = {
        maintenanceMode: false,
        home: {
          showBanners: true,
          showTiles: true,
          showLab: true,
        },
      }
      await writeJson('settings', defaultSettings)
      return res.json(defaultSettings)
    }
    // Убеждаемся, что home настройки есть
    if (!settings.home) {
      settings.home = {
        showBanners: true,
        showTiles: true,
        showLab: true,
      }
    }
    res.json(settings)
  } catch (error: any) {
    console.error('Error fetching settings:', error)
    res.status(500).json({ error: 'Failed to fetch settings' })
  }
})

// PATCH /api/admin/settings
router.patch('/', async (req, res) => {
  try {
    const { maintenanceMode, home } = req.body
    
    // Читаем текущие настройки
    const currentSettings = await readJson<Settings>('settings') || {
      maintenanceMode: false,
      home: {
        showBanners: true,
        showTiles: true,
        showLab: true,
      },
    }
    
    // Обновляем maintenanceMode, если передан
    if (typeof maintenanceMode === 'boolean') {
      currentSettings.maintenanceMode = maintenanceMode
    }
    
    // Обновляем home настройки, если передан объект
    if (home && typeof home === 'object') {
      currentSettings.home = {
        showBanners: typeof home.showBanners === 'boolean' ? home.showBanners : (currentSettings.home?.showBanners ?? true),
        showTiles: typeof home.showTiles === 'boolean' ? home.showTiles : (currentSettings.home?.showTiles ?? true),
        showLab: typeof home.showLab === 'boolean' ? home.showLab : (currentSettings.home?.showLab ?? true),
      }
    }
    
    // Если home не был передан, но его нет в текущих настройках, добавляем дефолтные
    if (!currentSettings.home) {
      currentSettings.home = {
        showBanners: true,
        showTiles: true,
        showLab: true,
      }
    }
    
    await writeJson('settings', currentSettings)
    
    res.json(currentSettings)
  } catch (error: any) {
    console.error('Error updating settings:', error)
    res.status(500).json({ error: 'Failed to update settings' })
  }
})

export default router

