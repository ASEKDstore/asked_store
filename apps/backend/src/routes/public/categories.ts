import { Router, Request, Response } from 'express'
import { prisma } from '../../db/prisma.js'

const router = Router()

// GET /api/public/categories
router.get('/', async (req: Request, res: Response) => {
  try {
    const categories = await prisma.category.findMany({
      where: {
        isActive: true,
        products: {
          some: {
            isActive: true,
            status: 'published',
          },
        },
      },
      orderBy: [{ order: 'asc' }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        slug: true,
      },
    })
    
    res.json(categories)
  } catch (error: any) {
    console.error('Error fetching categories:', error)
    res.status(500).json({ error: 'Failed to fetch categories' })
  }
})

export default router

