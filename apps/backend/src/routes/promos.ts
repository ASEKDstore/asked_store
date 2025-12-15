import { Router } from 'express'
import { prisma } from '../db/prisma.js'

const router = Router()

// POST /api/promos/apply
router.post('/apply', async (req, res) => {
  try {
    const { code, cartTotal } = req.body
    
    if (!code || cartTotal === undefined) {
      return res.status(400).json({ error: 'Missing code or cartTotal' })
    }
    
    const promo = await prisma.promo.findUnique({
      where: { code: code.toUpperCase() },
    })
    
    if (!promo) {
      return res.status(400).json({ ok: false, error: 'Promo code not found' })
    }
    
    if (!promo.isActive) {
      return res.status(400).json({ ok: false, error: 'Promo code is inactive' })
    }
    
    // Calculate discount
    const discount = Math.round((cartTotal * promo.discountPercent) / 100)
    const totalAfter = Math.max(0, cartTotal - discount)
    
    res.json({
      ok: true,
      discount,
      totalAfter,
      promoId: promo.id,
      code: promo.code,
    })
  } catch (error: any) {
    console.error('Error applying promo:', error)
    res.status(500).json({ ok: false, error: 'Failed to apply promo' })
  }
})

export default router
