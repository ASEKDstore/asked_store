import { Router } from 'express'
import * as labStore from '../../store/labStore.js'
import type { CreateLabArtistRequest, CreateLabProductRequest } from '../../types/lab.js'

const router = Router()

// ========== ARTISTS ==========

// GET /api/admin/lab/artists
router.get('/artists', async (req, res) => {
  try {
    const artists = await labStore.getArtists()
    res.json(artists)
  } catch (error: any) {
    console.error('Error fetching lab artists:', error)
    res.status(500).json({ error: 'Failed to fetch lab artists' })
  }
})

// POST /api/admin/lab/artists
router.post('/artists', async (req, res) => {
  try {
    const data: CreateLabArtistRequest = req.body
    
    // Validation
    if (!data.name || !data.bio) {
      return res.status(400).json({ error: 'Missing required fields: name, bio' })
    }
    
    const artist = await labStore.addArtist({
      name: data.name,
      avatar: data.avatar,
      bio: data.bio,
      links: data.links || [],
      active: data.active ?? true,
    })
    
    res.status(201).json(artist)
  } catch (error: any) {
    console.error('Error creating lab artist:', error)
    res.status(500).json({ error: error.message || 'Failed to create lab artist' })
  }
})

// PUT /api/admin/lab/artists/:id
router.put('/artists/:id', async (req, res) => {
  try {
    const { id } = req.params
    const data: Partial<CreateLabArtistRequest> = req.body
    
    const artist = await labStore.updateArtist(id, {
      name: data.name,
      avatar: data.avatar,
      bio: data.bio,
      links: data.links,
      active: data.active,
    })
    
    res.json(artist)
  } catch (error: any) {
    console.error('Error updating lab artist:', error)
    if (error.message === 'Artist not found') {
      return res.status(404).json({ error: error.message })
    }
    res.status(500).json({ error: error.message || 'Failed to update lab artist' })
  }
})

// DELETE /api/admin/lab/artists/:id
router.delete('/artists/:id', async (req, res) => {
  try {
    const { id } = req.params
    
    await labStore.deleteArtist(id)
    
    res.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting lab artist:', error)
    if (error.message === 'Artist not found' || error.message === 'Cannot delete artist with existing products') {
      return res.status(400).json({ error: error.message })
    }
    res.status(500).json({ error: error.message || 'Failed to delete lab artist' })
  }
})

// ========== LAB PRODUCTS ==========

// GET /api/admin/lab/products
router.get('/products', async (req, res) => {
  try {
    const { artistId } = req.query
    const products = await labStore.getLabProducts(artistId as string | undefined)
    res.json(products)
  } catch (error: any) {
    console.error('Error fetching lab products:', error)
    res.status(500).json({ error: 'Failed to fetch lab products' })
  }
})

// POST /api/admin/lab/products
router.post('/products', async (req, res) => {
  try {
    const data: CreateLabProductRequest = req.body
    
    // Validation
    if (!data.artistId || !data.title || data.price === undefined) {
      return res.status(400).json({ error: 'Missing required fields: artistId, title, price' })
    }
    
    const product = await labStore.addLabProduct({
      artistId: data.artistId,
      title: data.title,
      description: data.description || '',
      price: data.price,
      images: data.images || [],
      tags: data.tags || [],
      available: data.available ?? true,
    })
    
    res.status(201).json(product)
  } catch (error: any) {
    console.error('Error creating lab product:', error)
    if (error.message === 'Artist not found') {
      return res.status(400).json({ error: error.message })
    }
    res.status(500).json({ error: error.message || 'Failed to create lab product' })
  }
})

// PUT /api/admin/lab/products/:id
router.put('/products/:id', async (req, res) => {
  try {
    const { id } = req.params
    const data: Partial<CreateLabProductRequest> = req.body
    
    const product = await labStore.updateLabProduct(id, {
      artistId: data.artistId,
      title: data.title,
      description: data.description,
      price: data.price,
      images: data.images,
      tags: data.tags,
      available: data.available,
    })
    
    res.json(product)
  } catch (error: any) {
    console.error('Error updating lab product:', error)
    if (error.message === 'Lab product not found' || error.message === 'Artist not found') {
      return res.status(404).json({ error: error.message })
    }
    res.status(500).json({ error: error.message || 'Failed to update lab product' })
  }
})

// DELETE /api/admin/lab/products/:id
router.delete('/products/:id', async (req, res) => {
  try {
    const { id } = req.params
    
    await labStore.deleteLabProduct(id)
    
    res.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting lab product:', error)
    if (error.message === 'Lab product not found') {
      return res.status(404).json({ error: error.message })
    }
    res.status(500).json({ error: error.message || 'Failed to delete lab product' })
  }
})

export default router
