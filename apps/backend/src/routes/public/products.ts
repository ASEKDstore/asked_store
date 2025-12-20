import { Router, Request, Response } from 'express'
import { prisma } from '../../db/prisma.js'

const router = Router()

// GET /api/public/products
router.get('/', async (req: Request, res: Response) => {
  try {
    const { categoryId, categorySlug, inStock, search, sort } = req.query
    
    const where: any = {
      isActive: true,
      status: 'published',
    }
    
    // Filter by category
    if (categoryId || categorySlug) {
      where.categories = {
        some: categoryId 
          ? { id: categoryId as string }
          : { slug: categorySlug as string },
      }
    }
    
    // Filter by stock (inStock=true means isActive=true, which is already applied)
    // We can add stock quantity later if needed
    
    // Search filter
    if (search && typeof search === 'string') {
      const searchLower = search.toLowerCase()
      where.OR = [
        { title: { contains: searchLower, mode: 'insensitive' } },
        { description: { contains: searchLower, mode: 'insensitive' } },
        { article: { contains: searchLower, mode: 'insensitive' } },
      ]
    }
    
    // Sort
    let orderBy: any = { createdAt: 'desc' }
    if (sort === 'price_asc') {
      orderBy = { price: 'asc' }
    } else if (sort === 'price_desc') {
      orderBy = { price: 'desc' }
    } else if (sort === 'newest') {
      orderBy = { createdAt: 'desc' }
    } else if (sort === 'popular') {
      // For now, use createdAt. Can add popularity field later
      orderBy = { createdAt: 'desc' }
    }
    
    const products = await prisma.product.findMany({
      where,
      include: {
        categories: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
          where: {
            isActive: true,
          },
        },
      },
      orderBy,
    })
    
    res.json(products)
  } catch (error: any) {
    console.error('Error fetching public products:', error)
    res.status(500).json({ error: 'Failed to fetch products' })
  }
})

// GET /api/public/products/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    
    const product = await prisma.product.findFirst({
      where: {
        id,
        isActive: true,
        status: 'published',
      },
      include: {
        categories: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
          where: {
            isActive: true,
          },
        },
      },
    })
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' })
    }
    
    res.json(product)
  } catch (error: any) {
    console.error('Error fetching product:', error)
    res.status(500).json({ error: 'Failed to fetch product' })
  }
})


export default router

