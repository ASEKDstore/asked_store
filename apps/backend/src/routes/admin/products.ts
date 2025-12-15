import { Router } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { readJson, writeJson } from '../../store/jsonDb.js'
import type { Product, CreateProductRequest, UpdateProductRequest } from '../../types/product.js'

const router = Router()

// GET /api/admin/products
router.get('/', async (req, res) => {
  try {
    const { q, category, available } = req.query
    
    const products = await readJson<Product[]>('products') || []
    
    let filtered = products
    
    // Search
    if (q && typeof q === 'string') {
      const query = q.toLowerCase()
      filtered = filtered.filter(p => 
        p.title.toLowerCase().includes(query) ||
        p.article.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query)
      )
    }
    
    // Filter by category
    if (category && typeof category === 'string') {
      filtered = filtered.filter(p => p.category === category)
    }
    
    // Filter by available
    if (available !== undefined) {
      const isAvailable = available === 'true'
      filtered = filtered.filter(p => p.available === isAvailable)
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
    const data: CreateProductRequest = req.body
    
    if (!data.article || !data.title || !data.price || !data.category) {
      return res.status(400).json({ error: 'Missing required fields' })
    }
    
    const products = await readJson<Product[]>('products') || []
    
    const product: Product = {
      id: uuidv4(),
      article: data.article,
      title: data.title,
      shortTitle: data.shortTitle,
      price: data.price,
      image: data.image,
      images: data.images || [],
      description: data.description,
      sizes: data.sizes || [],
      category: data.category,
      tags: data.tags || [],
      available: data.available ?? true,
      featured: data.featured ?? false,
      badge: data.badge,
      cardAccent: data.cardAccent,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    
    products.push(product)
    await writeJson('products', products)
    
    res.status(201).json(product)
  } catch (error: any) {
    console.error('Error creating product:', error)
    res.status(500).json({ error: 'Failed to create product' })
  }
})

// PUT /api/admin/products/:id
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const data: UpdateProductRequest = req.body
    
    const products = await readJson<Product[]>('products') || []
    const index = products.findIndex(p => p.id === id)
    
    if (index === -1) {
      return res.status(404).json({ error: 'Product not found' })
    }
    
    products[index] = {
      ...products[index],
      ...data,
      updatedAt: new Date().toISOString(),
    }
    
    await writeJson('products', products)
    
    res.json(products[index])
  } catch (error: any) {
    console.error('Error updating product:', error)
    res.status(500).json({ error: 'Failed to update product' })
  }
})

// DELETE /api/admin/products/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params
    
    const products = await readJson<Product[]>('products') || []
    const filtered = products.filter(p => p.id !== id)
    
    if (filtered.length === products.length) {
      return res.status(404).json({ error: 'Product not found' })
    }
    
    await writeJson('products', filtered)
    
    res.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting product:', error)
    res.status(500).json({ error: 'Failed to delete product' })
  }
})

export default router



