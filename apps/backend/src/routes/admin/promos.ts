import { Router } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { readJson, writeJson } from '../../store/jsonDb.js'
import type { Promo, CreatePromoRequest, GeneratePromosRequest } from '../../types/promo.js'

const router = Router()

// GET /api/admin/promos
router.get('/', async (req, res) => {
  try {
    const promos = await readJson<Promo[]>('promos') || []
    res.json(promos)
  } catch (error: any) {
    console.error('Error fetching promos:', error)
    res.status(500).json({ error: 'Failed to fetch promos' })
  }
})

// POST /api/admin/promos
router.post('/', async (req, res) => {
  try {
    const data: CreatePromoRequest = req.body
    
    if (!data.code || !data.type || data.value === undefined) {
      return res.status(400).json({ error: 'Missing required fields' })
    }
    
    const promos = await readJson<Promo[]>('promos') || []
    
    // Check if code already exists
    if (promos.some(p => p.code === data.code)) {
      return res.status(400).json({ error: 'Promo code already exists' })
    }
    
    const promo: Promo = {
      id: uuidv4(),
      code: data.code.toUpperCase(),
      type: data.type,
      value: data.value,
      active: data.active ?? true,
      usageLimit: data.usageLimit ?? null,
      usedCount: 0,
      expiresAt: data.expiresAt || null,
      createdAt: new Date().toISOString(),
    }
    
    promos.push(promo)
    await writeJson('promos', promos)
    
    res.status(201).json(promo)
  } catch (error: any) {
    console.error('Error creating promo:', error)
    res.status(500).json({ error: 'Failed to create promo' })
  }
})

// POST /api/admin/promos/generate
router.post('/generate', async (req, res) => {
  try {
    const data: GeneratePromosRequest = req.body
    
    if (!data.count || !data.type || data.value === undefined) {
      return res.status(400).json({ error: 'Missing required fields' })
    }
    
    const promos = await readJson<Promo[]>('promos') || []
    const prefix = data.prefix || 'ASK'
    const generated: Promo[] = []
    
    for (let i = 0; i < data.count; i++) {
      const code = `${prefix}${Date.now()}${Math.random().toString(36).substring(2, 8).toUpperCase()}`
      
      const promo: Promo = {
        id: uuidv4(),
        code,
        type: data.type,
        value: data.value,
        active: true,
        usageLimit: data.usageLimit ?? null,
        usedCount: 0,
        expiresAt: data.expiresAt || null,
        createdAt: new Date().toISOString(),
      }
      
      promos.push(promo)
      generated.push(promo)
    }
    
    await writeJson('promos', promos)
    
    res.status(201).json(generated)
  } catch (error: any) {
    console.error('Error generating promos:', error)
    res.status(500).json({ error: 'Failed to generate promos' })
  }
})

// PATCH /api/admin/promos/:id
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { active, usageLimit, expiresAt } = req.body
    
    const promos = await readJson<Promo[]>('promos') || []
    const index = promos.findIndex(p => p.id === id)
    
    if (index === -1) {
      return res.status(404).json({ error: 'Promo not found' })
    }
    
    if (active !== undefined) promos[index].active = active
    if (usageLimit !== undefined) promos[index].usageLimit = usageLimit
    if (expiresAt !== undefined) promos[index].expiresAt = expiresAt
    
    await writeJson('promos', promos)
    
    res.json(promos[index])
  } catch (error: any) {
    console.error('Error updating promo:', error)
    res.status(500).json({ error: 'Failed to update promo' })
  }
})

// DELETE /api/admin/promos/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params
    
    const promos = await readJson<Promo[]>('promos') || []
    const filtered = promos.filter(p => p.id !== id)
    
    if (filtered.length === promos.length) {
      return res.status(404).json({ error: 'Promo not found' })
    }
    
    await writeJson('promos', filtered)
    
    res.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting promo:', error)
    res.status(500).json({ error: 'Failed to delete promo' })
  }
})

export default router



