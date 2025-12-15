import { Router } from 'express'
import { prisma } from '../../db/prisma.js'
import { z } from 'zod'

const router = Router()

const CreatePromoSchema = z.object({
  code: z.string().min(1),
  discountPercent: z.number().int().min(0).max(100),
  isActive: z.boolean().default(true),
})

const GeneratePromosSchema = z.object({
  count: z.number().int().positive(),
  discountPercent: z.number().int().min(0).max(100),
  prefix: z.string().optional().default('ASK'),
})

// GET /api/admin/promos
router.get('/', async (req, res) => {
  try {
    const promos = await prisma.promo.findMany({
      orderBy: { createdAt: 'desc' },
    })
    res.json(promos)
  } catch (error: any) {
    console.error('Error fetching promos:', error)
    res.status(500).json({ error: 'Failed to fetch promos' })
  }
})

// POST /api/admin/promos
router.post('/', async (req, res) => {
  try {
    const data = CreatePromoSchema.parse({
      ...req.body,
      code: req.body.code?.toUpperCase(),
    })
    
    const promo = await prisma.promo.create({
      data,
    })
    
    res.status(201).json(promo)
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Promo code already exists' })
    }
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors })
    }
    console.error('Error creating promo:', error)
    res.status(500).json({ error: 'Failed to create promo' })
  }
})

// POST /api/admin/promos/generate
router.post('/generate', async (req, res) => {
  try {
    const data = GeneratePromosSchema.parse(req.body)
    const generated = []
    
    for (let i = 0; i < data.count; i++) {
      const code = `${data.prefix}${Date.now()}${Math.random().toString(36).substring(2, 8).toUpperCase()}`
      
      try {
        const promo = await prisma.promo.create({
          data: {
            code,
            discountPercent: data.discountPercent,
            isActive: true,
          },
        })
        generated.push(promo)
      } catch (err: any) {
        // Skip duplicates
        if (err.code !== 'P2002') throw err
      }
    }
    
    res.status(201).json(generated)
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors })
    }
    console.error('Error generating promos:', error)
    res.status(500).json({ error: 'Failed to generate promos' })
  }
})

// PATCH /api/admin/promos/:id
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { isActive } = req.body
    
    const promo = await prisma.promo.update({
      where: { id },
      data: {
        isActive: isActive !== undefined ? isActive : undefined,
      },
    })
    
    res.json(promo)
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Promo not found' })
    }
    console.error('Error updating promo:', error)
    res.status(500).json({ error: 'Failed to update promo' })
  }
})

// DELETE /api/admin/promos/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params
    
    await prisma.promo.delete({
      where: { id },
    })
    
    res.json({ success: true })
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Promo not found' })
    }
    console.error('Error deleting promo:', error)
    res.status(500).json({ error: 'Failed to delete promo' })
  }
})

export default router
