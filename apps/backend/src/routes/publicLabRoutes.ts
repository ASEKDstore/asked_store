import { Router } from 'express'
import * as labStore from '../store/labStore.js'

const router = Router()

// GET /api/lab/artists
router.get('/artists', async (req, res) => {
  try {
    const artists = await labStore.listArtists({ onlyActive: true })
    res.json(artists)
  } catch (error: any) {
    console.error('Error fetching lab artists:', error)
    res.status(500).json({ error: 'Failed to fetch lab artists' })
  }
})

// GET /api/lab/products
router.get('/products', async (req, res) => {
  try {
    const { artistId } = req.query
    const products = await labStore.listLabProducts({
      artistId: artistId as string | undefined,
      onlyAvailable: true,
    })
    res.json(products)
  } catch (error: any) {
    console.error('Error fetching lab products:', error)
    res.status(500).json({ error: 'Failed to fetch lab products' })
  }
})

// GET /api/lab/products/:id
router.get('/products/:id', async (req, res) => {
  try {
    const product = await labStore.getLabProduct(req.params.id)
    if (!product) {
      return res.status(404).json({ error: 'Lab product not found' })
    }
    
    // Only return if available
    if (!product.available) {
      return res.status(404).json({ error: 'Lab product not found' })
    }
    
    res.json(product)
  } catch (error: any) {
    console.error('Error fetching lab product:', error)
    res.status(500).json({ error: 'Failed to fetch lab product' })
  }
})

export default router



