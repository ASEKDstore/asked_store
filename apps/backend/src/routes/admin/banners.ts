import { Router, Request, Response, NextFunction } from 'express'
import { readJson, writeJson } from '../../store/jsonDb.js'
import type { Banner, CreateBannerRequest, UpdateBannerRequest } from '../../types/banner.js'

const router = Router()

// GET /api/admin/banners
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const banners = await readJson<Banner[]>('banners', [])
    // Sort by order if exists, then by createdAt (безопасная сортировка)
    banners.sort((a, b) => {
      if (a.order !== undefined && b.order !== undefined) {
        return a.order - b.order
      }
      const timeA = Date.parse(a.createdAt) || 0
      const timeB = Date.parse(b.createdAt) || 0
      return timeB - timeA
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
    
    // Нормализация полей (принимаем оба варианта ключей)
    const title = String(raw.title ?? '').trim()
    const subtitle = String(raw.subtitle ?? '').trim() || undefined
    const description = String(raw.description ?? '').trim()
    const image = String(raw.image ?? raw.imageUrl ?? '').trim()
    const ctaText = String(raw.ctaText ?? raw.buttonText ?? '').trim() || undefined
    const detailsImage = String(raw.detailsImage ?? raw.detailsImageUrl ?? '').trim() || undefined
    
    // Валидация обязательных полей
    if (!title) {
      return res.status(400).json({ message: 'title is required' })
    }
    if (!description) {
      return res.status(400).json({ message: 'description is required' })
    }
    if (!image) {
      return res.status(400).json({ message: 'image is required' })
    }
    
    // Читаем существующие баннеры
    const banners = await readJson<Banner[]>('banners', [])
    
    // Создаём баннер
    const banner: Banner = {
      id: crypto.randomUUID(),
      title,
      subtitle,
      description,
      image,
      ctaText,
      detailsImage,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    
    // Сохраняем
    banners.push(banner)
    await writeJson('banners', banners)
    
    res.status(201).json(banner)
  } catch (error: any) {
    next(error)
  }
})

// PUT /api/admin/banners/:id
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const raw = req.body
    
    const banners = await readJson<Banner[]>('banners', [])
    const index = banners.findIndex(b => b.id === id)
    
    if (index === -1) {
      return res.status(404).json({ message: 'Banner not found' })
    }
    
    const existing = banners[index]
    
    // Нормализация полей (принимаем оба варианта ключей, обновляем только переданные)
    const title = raw.title !== undefined ? String(raw.title ?? '').trim() : existing.title
    const subtitle = raw.subtitle !== undefined ? (String(raw.subtitle ?? '').trim() || undefined) : existing.subtitle
    const description = raw.description !== undefined ? String(raw.description ?? '').trim() : existing.description
    const image = (raw.image !== undefined || raw.imageUrl !== undefined)
      ? String(raw.image ?? raw.imageUrl ?? '').trim()
      : existing.image
    const ctaText = (raw.ctaText !== undefined || raw.buttonText !== undefined)
      ? (String(raw.ctaText ?? raw.buttonText ?? '').trim() || undefined)
      : existing.ctaText
    const detailsImage = (raw.detailsImage !== undefined || raw.detailsImageUrl !== undefined)
      ? (String(raw.detailsImage ?? raw.detailsImageUrl ?? '').trim() || undefined)
      : existing.detailsImage
    
    // Валидация обязательных полей
    if (!title) {
      return res.status(400).json({ message: 'title is required' })
    }
    if (!description) {
      return res.status(400).json({ message: 'description is required' })
    }
    if (!image) {
      return res.status(400).json({ message: 'image is required' })
    }
    
    banners[index] = {
      ...existing,
      title,
      subtitle,
      description,
      image,
      ctaText,
      detailsImage,
      updatedAt: new Date().toISOString(),
    }
    
    await writeJson('banners', banners)
    
    res.json(banners[index])
  } catch (error: any) {
    next(error)
  }
})

// DELETE /api/admin/banners/:id
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    
    const banners = await readJson<Banner[]>('banners', [])
    const filtered = banners.filter(b => b.id !== id)
    
    if (filtered.length === banners.length) {
      return res.status(404).json({ message: 'Banner not found' })
    }
    
    await writeJson('banners', filtered)
    
    res.json({ success: true })
  } catch (error: any) {
    next(error)
  }
})

export default router

