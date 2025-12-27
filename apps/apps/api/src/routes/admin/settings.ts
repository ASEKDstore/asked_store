// Admin settings CRUD endpoints

import { Router, Request, Response } from 'express'
import { prisma } from '../../prisma.js'
import type { SettingsScope, SettingsDTO, UpdateSettingsRequestDTO } from '@asked-store/shared'

const router = Router()

// Whitelist of public settings keys
const PUBLIC_SETTINGS_KEYS = ['shopName', 'supportContact', 'uiFlags'] as const

/**
 * GET /admin/settings
 * Get all settings (optionally filtered by scope)
 * Requires: admin.access permission
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const scope = req.query.scope as SettingsScope | undefined

    const where = scope ? { scope } : {}

    const settings = await prisma.settings.findMany({
      where,
      orderBy: { key: 'asc' },
    })

    const settingsDTO: SettingsDTO[] = settings.map((setting) => ({
      id: setting.id,
      key: setting.key,
      value: setting.value as unknown,
      scope: setting.scope as SettingsScope,
      updatedBy: setting.updatedBy,
      updatedAt: setting.updatedAt.toISOString(),
      createdAt: setting.createdAt.toISOString(),
    }))

    res.json(settingsDTO)
  } catch (error) {
    console.error('Error fetching settings:', error)
    res.status(500).json({ error: 'Failed to fetch settings' })
  }
})

/**
 * PUT /admin/settings/:key
 * Update or create a setting
 * Requires: admin.access permission
 */
router.put('/:key', async (req: Request, res: Response) => {
  try {
    const { key } = req.params
    const { value }: UpdateSettingsRequestDTO = req.body

    // Get current user from request (set by verifyJwt middleware)
    const userId = (req.user as { sub: string })?.sub
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }

    // Validate value is valid JSON (already parsed by express.json())
    if (value === undefined) {
      res.status(400).json({ error: 'Value is required' })
      return
    }

    // Get existing setting to track old value for audit log
    const existingSetting = await prisma.settings.findUnique({
      where: { key },
    })

    // Upsert setting
    const setting = await prisma.settings.upsert({
      where: { key },
      update: {
        value: value as any, // Prisma Json type
        updatedBy: userId,
        updatedAt: new Date(),
      },
      create: {
        key,
        value: value as any, // Prisma Json type
        scope: 'global', // Default scope, can be extended to accept scope in request
        updatedBy: userId,
      },
    })

    // Create audit log entry
    await prisma.auditLog.create({
      data: {
        userId,
        action: existingSetting ? 'settings.update' : 'settings.create',
        resource: 'settings',
        resourceId: key,
        oldValue: existingSetting?.value as any,
        newValue: value as any,
        metadata: {
          scope: setting.scope,
        },
      },
    })

    const settingsDTO: SettingsDTO = {
      id: setting.id,
      key: setting.key,
      value: setting.value as unknown,
      scope: setting.scope as SettingsScope,
      updatedBy: setting.updatedBy,
      updatedAt: setting.updatedAt.toISOString(),
      createdAt: setting.createdAt.toISOString(),
    }

    res.json(settingsDTO)
  } catch (error) {
    console.error('Error updating setting:', error)
    res.status(500).json({ error: 'Failed to update setting' })
  }
})

export { router as adminSettingsRouter, PUBLIC_SETTINGS_KEYS }

