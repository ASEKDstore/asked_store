import { Router, Request, Response } from 'express'
import { prisma } from '../../db/prisma.js'
import { z } from 'zod'

const router = Router()

const CreateCategorySchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  isActive: z.boolean().default(true),
  order: z.number().int().default(0),
})

const UpdateCategorySchema = CreateCategorySchema.partial()

// Helper: generate slug from name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special chars
    .replace(/[\s_-]+/g, '-') // Replace spaces/underscores with hyphens
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
}

// GET /api/admin/categories
router.get('/', async (req: Request, res: Response) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: [{ order: 'asc' }, { name: 'asc' }],
    })
    res.json(categories)
  } catch (error: any) {
    console.error('Error fetching categories:', error)
    res.status(500).json({ error: 'Failed to fetch categories' })
  }
})

// GET /api/admin/categories/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        products: {
          select: { id: true, title: true },
        },
      },
    })
    
    if (!category) {
      return res.status(404).json({ error: 'Category not found' })
    }
    
    res.json(category)
  } catch (error: any) {
    console.error('Error fetching category:', error)
    res.status(500).json({ error: 'Failed to fetch category' })
  }
})

// POST /api/admin/categories
router.post('/', async (req: Request, res: Response) => {
  try {
    const raw = req.body
    
    // Auto-generate slug if not provided
    if (!raw.slug && raw.name) {
      raw.slug = generateSlug(raw.name)
    }
    
    const data = CreateCategorySchema.parse(raw)
    
    // Check if slug already exists
    const existing = await prisma.category.findUnique({
      where: { slug: data.slug },
    })
    
    if (existing) {
      return res.status(400).json({ error: `Category with slug "${data.slug}" already exists` })
    }
    
    const category = await prisma.category.create({
      data: {
        name: data.name,
        slug: data.slug,
        isActive: data.isActive,
        order: data.order,
      },
    })
    
    res.status(201).json(category)
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors })
    }
    if (error.code === 'P2002') {
      return res.status(400).json({ error: `Category with slug "${req.body.slug}" already exists` })
    }
    console.error('Error creating category:', error)
    res.status(500).json({ error: 'Failed to create category' })
  }
})

// PATCH /api/admin/categories/:id
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const raw = req.body
    
    // Auto-generate slug if name changed and slug not provided
    if (raw.name && !raw.slug) {
      raw.slug = generateSlug(raw.name)
    }
    
    const data = UpdateCategorySchema.parse(raw)
    
    // Check slug uniqueness if slug is being updated
    if (data.slug) {
      const existing = await prisma.category.findFirst({
        where: {
          slug: data.slug,
          id: { not: id },
        },
      })
      
      if (existing) {
        return res.status(400).json({ error: `Category with slug "${data.slug}" already exists` })
      }
    }
    
    const category = await prisma.category.update({
      where: { id },
      data,
    })
    
    res.json(category)
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Category not found' })
    }
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors })
    }
    if (error.code === 'P2002') {
      return res.status(400).json({ error: `Category with slug "${req.body.slug}" already exists` })
    }
    console.error('Error updating category:', error)
    res.status(500).json({ error: 'Failed to update category' })
  }
})

// DELETE /api/admin/categories/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    
    // Check if category has products
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        products: {
          take: 1,
        },
      },
    })
    
    if (!category) {
      return res.status(404).json({ error: 'Category not found' })
    }
    
    if (category.products.length > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete category with associated products. Remove products first or deactivate category.' 
      })
    }
    
    await prisma.category.delete({
      where: { id },
    })
    
    res.json({ success: true })
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Category not found' })
    }
    console.error('Error deleting category:', error)
    res.status(500).json({ error: 'Failed to delete category' })
  }
})

export default router

