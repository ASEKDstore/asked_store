import { Router } from 'express'
import { prisma } from '../../db/prisma.js'
import { z } from 'zod'

const router = Router()

const CreateProductSchema = z.object({
  title: z.string().min(1),
  description: z.string(),
  price: z.number().int().positive(),
  images: z.array(z.string()).default([]),
  sku: z.string().optional(),
  article: z.string().optional(),
  isActive: z.boolean().default(true),
})

const UpdateProductSchema = CreateProductSchema.partial()

// GET /api/admin/products
router.get('/', async (req, res) => {
  try {
    const { q, category, available } = req.query
    
    const where: any = {}
    
    if (available !== undefined) {
      where.isActive = available === 'true'
    }
    
    const products = await prisma.product.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })
    
    // Search filter (if needed, can be moved to Prisma query)
    let filtered = products
    if (q && typeof q === 'string') {
      const query = q.toLowerCase()
      filtered = filtered.filter(p => 
        p.title.toLowerCase().includes(query) ||
        p.article?.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query)
      )
    }
    
    res.json(filtered)
  } catch (error: any) {
    console.error('Error fetching products:', error)
    res.status(500).json({ error: 'Failed to fetch products' })
  }
})

// POST /api/admin/products
router.post('/', async (req, res) => {
  try {
    const raw = req.body
    
    // Validate required fields
    if (!raw.title || typeof raw.title !== 'string' || raw.title.trim().length === 0) {
      return res.status(400).json({ error: 'title is required and must be a non-empty string' })
    }
    if (raw.description === undefined || typeof raw.description !== 'string') {
      return res.status(400).json({ error: 'description is required' })
    }
    if (raw.price === undefined || typeof raw.price !== 'number' || !Number.isInteger(raw.price) || raw.price <= 0) {
      return res.status(400).json({ error: 'price is required and must be a positive integer' })
    }
    
    const data = CreateProductSchema.parse(req.body)
    
    const product = await prisma.product.create({
      data: {
        title: data.title,
        description: data.description,
        price: data.price,
        images: data.images,
        sku: data.sku,
        article: data.article,
        isActive: data.isActive,
      },
    })
    
    res.status(201).json(product)
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors })
    }
    console.error('Error creating product:', error)
    res.status(500).json({ error: 'Failed to create product' })
  }
})

// PUT /api/admin/products/:id
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const data = UpdateProductSchema.parse(req.body)
    
    const product = await prisma.product.update({
      where: { id },
      data,
    })
    
    res.json(product)
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Product not found' })
    }
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors })
    }
    console.error('Error updating product:', error)
    res.status(500).json({ error: 'Failed to update product' })
  }
})

// DELETE /api/admin/products/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params
    
    await prisma.product.delete({
      where: { id },
    })
    
    res.json({ success: true })
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Product not found' })
    }
    console.error('Error deleting product:', error)
    res.status(500).json({ error: 'Failed to delete product' })
  }
})

export default router
