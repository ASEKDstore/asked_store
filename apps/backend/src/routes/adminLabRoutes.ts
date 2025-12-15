import { Router } from 'express'
import * as labStore from '../store/labStore.js'

const router = Router()

// ========== ARTISTS ==========

// GET /api/admin/lab/artists
router.get('/artists', async (req, res) => {
  try {
    const artists = await labStore.listArtists()
    res.json(artists)
  } catch (error: any) {
    console.error('Error fetching artists:', error)
    res.status(500).json({ error: 'Failed to fetch artists' })
  }
})

// POST /api/admin/lab/artists
router.post('/artists', async (req, res) => {
  try {
    const artist = await labStore.createArtist(req.body)
    res.status(201).json(artist)
  } catch (error: any) {
    console.error('Error creating artist:', error)
    if (error.message === 'Name is required') {
      return res.status(400).json({ error: error.message })
    }
    res.status(500).json({ error: 'Failed to create artist' })
  }
})

// GET /api/admin/lab/artists/:id
router.get('/artists/:id', async (req, res) => {
  try {
    const artist = await labStore.getArtist(req.params.id)
    if (!artist) {
      return res.status(404).json({ error: 'Artist not found' })
    }
    res.json(artist)
  } catch (error: any) {
    console.error('Error fetching artist:', error)
    res.status(500).json({ error: 'Failed to fetch artist' })
  }
})

// PUT /api/admin/lab/artists/:id
router.put('/artists/:id', async (req, res) => {
  try {
    const artist = await labStore.updateArtist(req.params.id, req.body)
    res.json(artist)
  } catch (error: any) {
    console.error('Error updating artist:', error)
    if (error.message === 'Artist not found') {
      return res.status(404).json({ error: error.message })
    }
    res.status(500).json({ error: 'Failed to update artist' })
  }
})

// DELETE /api/admin/lab/artists/:id
router.delete('/artists/:id', async (req, res) => {
  try {
    await labStore.deleteArtist(req.params.id)
    res.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting artist:', error)
    if (error.message === 'Artist not found') {
      return res.status(404).json({ error: error.message })
    }
    if (error.message === 'Cannot delete artist with existing products') {
      return res.status(409).json({ error: error.message })
    }
    res.status(500).json({ error: 'Failed to delete artist' })
  }
})

// ========== LAB PRODUCTS ==========

// GET /api/admin/lab/products
router.get('/products', async (req, res) => {
  try {
    const { artistId } = req.query
    const products = await labStore.listLabProducts({
      artistId: artistId as string | undefined,
    })
    res.json(products)
  } catch (error: any) {
    console.error('Error fetching lab products:', error)
    res.status(500).json({ error: 'Failed to fetch lab products' })
  }
})

// POST /api/admin/lab/products
router.post('/products', async (req, res) => {
  try {
    const product = await labStore.createLabProduct(req.body)
    res.status(201).json(product)
  } catch (error: any) {
    console.error('Error creating lab product:', error)
    if (error.message.includes('required') || error.message.includes('Price must be')) {
      return res.status(400).json({ error: error.message })
    }
    if (error.message === 'Artist not found') {
      return res.status(400).json({ error: error.message })
    }
    res.status(500).json({ error: 'Failed to create lab product' })
  }
})

// GET /api/admin/lab/products/:id
router.get('/products/:id', async (req, res) => {
  try {
    const product = await labStore.getLabProduct(req.params.id)
    if (!product) {
      return res.status(404).json({ error: 'Lab product not found' })
    }
    res.json(product)
  } catch (error: any) {
    console.error('Error fetching lab product:', error)
    res.status(500).json({ error: 'Failed to fetch lab product' })
  }
})

// PUT /api/admin/lab/products/:id
router.put('/products/:id', async (req, res) => {
  try {
    const product = await labStore.updateLabProduct(req.params.id, req.body)
    res.json(product)
  } catch (error: any) {
    console.error('Error updating lab product:', error)
    if (error.message === 'Lab product not found' || error.message === 'Artist not found') {
      return res.status(404).json({ error: error.message })
    }
    if (error.message.includes('Price must be')) {
      return res.status(400).json({ error: error.message })
    }
    res.status(500).json({ error: 'Failed to update lab product' })
  }
})

// DELETE /api/admin/lab/products/:id
router.delete('/products/:id', async (req, res) => {
  try {
    await labStore.deleteLabProduct(req.params.id)
    res.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting lab product:', error)
    if (error.message === 'Lab product not found') {
      return res.status(404).json({ error: error.message })
    }
    res.status(500).json({ error: 'Failed to delete lab product' })
  }
})

export default router



