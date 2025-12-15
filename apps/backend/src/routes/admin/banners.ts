import { Router, Request, Response, NextFunction } from 'express'
import { prisma } from '../../db/prisma.js'
import { z } from 'zod'

const router = Router()

const CreateBannerSchema = z.object({
  title: z.string().min(1),
  subtitle: z.string().optional(),
  description: z.string().min(1),
  image: z.string().min(1),
  detailsImage: z.string().optional(),
  ctaText: z.string().optional(),
  order: z.number().int().default(0),
  isActive: z.boolean().default(true),
})

const UpdateBannerSchema = CreateBannerSchema.partial()

// GET /api/admin/banners
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const banners = await prisma.banner.findMany({
      orderBy: [
        { order: 'asc' },
        { createdAt: 'desc' },
      ],
    })
    res.json(banners)
  } catch (error: any) {
    next(error)
  }
})

// POST /api/admin/banners
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const raw = req.body
    
    // Validate required fields
    if (!raw.title || typeof raw.title !== 'string' || raw.title.trim().length === 0) {
      return res.status(400).json({ error: 'title is required and must be a non-empty string' })
    }
    if (!raw.description || typeof raw.description !== 'string' || raw.description.trim().length === 0) {
      return res.status(400).json({ error: 'description is required and must be a non-empty string' })
    }
    if (!raw.image && !raw.imageUrl) {
      return res.status(400).json({ error: 'image or imageUrl is required' })
    }
    
    const data = CreateBannerSchema.parse({
      title: raw.title,
      subtitle: raw.subtitle,
      description: raw.description,
      image: raw.image ?? raw.imageUrl,
      detailsImage: raw.detailsImage ?? raw.detailsImageUrl,
      ctaText: raw.ctaText ?? raw.buttonText,
      order: raw.order ?? 0,
      isActive: raw.isActive ?? true,
    })
    
    const banner = await prisma.banner.create({
      data: {
        title: data.title,
        subtitle: data.subtitle,
        description: data.description,
        image: data.image,
        detailsImage: data.detailsImage,
        ctaText: data.ctaText,
        order: data.order,
        isActive: data.isActive,
      },
    })
    
    res.status(201).json(banner)
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors })
    }
    next(error)
  }
})

// PUT /api/admin/banners/:id
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const raw = req.body
    
    const existing = await prisma.banner.findUnique({ where: { id } })
    if (!existing) {
      return res.status(404).json({ message: 'Banner not found' })
    }
    
    const data = UpdateBannerSchema.parse({
      title: raw.title ?? existing.title,
      subtitle: raw.subtitle !== undefined ? raw.subtitle : existing.subtitle,
      description: raw.description ?? existing.description,
      image: raw.image ?? raw.imageUrl ?? existing.image,
      detailsImage: raw.detailsImage ?? raw.detailsImageUrl ?? existing.detailsImage,
      ctaText: raw.ctaText ?? raw.buttonText ?? existing.ctaText,
      order: raw.order ?? existing.order,
      isActive: raw.isActive ?? existing.isActive,
    })
    
    const banner = await prisma.banner.update({
      where: { id },
      data,
    })
    
    res.json(banner)
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors })
    }
    next(error)
  }
})

// DELETE /api/admin/banners/:id
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    
    await prisma.banner.delete({
      where: { id },
    })
    
    res.json({ success: true })
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Banner not found' })
    }
    next(error)
  }
})

export default router
