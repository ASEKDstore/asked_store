import { Router } from 'express'
import * as labStore from '../store/labStore.js'

const router = Router()

// GET /api/lab/artists
router.get('/artists', async (req, res) => {
  try {
    const artists = await labStore.getArtists()
    // Return only active artists
    const activeArtists = artists.filter(a => a.active)
    res.json(activeArtists)
  } catch (error: any) {
    console.error('Error fetching lab artists:', error)
    res.status(500).json({ error: 'Failed to fetch lab artists' })
  }
})

// GET /api/lab/products
router.get('/products', async (req, res) => {
  try {
    const { artistId } = req.query
    const products = await labStore.getLabProducts(artistId as string | undefined)
    // Return only available products
    const availableProducts = products.filter(p => p.available)
    res.json(availableProducts)
  } catch (error: any) {
    console.error('Error fetching lab products:', error)
    res.status(500).json({ error: 'Failed to fetch lab products' })
  }
})

export default router
