import { Router } from 'express'
import { readJson, writeJson } from '../store/jsonDb.js'
import type { Promo, ApplyPromoRequest } from '../types/promo.js'

const router = Router()

// POST /api/promos/apply
router.post('/apply', async (req, res) => {
  try {
    const { code, cartTotal }: ApplyPromoRequest = req.body
    
    if (!code || cartTotal === undefined) {
      return res.status(400).json({ error: 'Missing code or cartTotal' })
    }
    
    const promos = await readJson<Promo[]>('promos') || []
    const promo = promos.find(p => p.code.toUpperCase() === code.toUpperCase())
    
    if (!promo) {
      return res.status(400).json({ ok: false, error: 'Promo code not found' })
    }
    
    if (!promo.active) {
      return res.status(400).json({ ok: false, error: 'Promo code is inactive' })
    }
    
    if (promo.expiresAt && new Date(promo.expiresAt) < new Date()) {
      return res.status(400).json({ ok: false, error: 'Promo code expired' })
    }
    
    if (promo.usageLimit !== null && promo.usedCount >= promo.usageLimit) {
      return res.status(400).json({ ok: false, error: 'Promo code usage limit reached' })
    }
    
    // Calculate discount
    let discount = 0
    if (promo.type === 'percent') {
      discount = Math.round((cartTotal * promo.value) / 100)
    } else {
      discount = promo.value
    }
    
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



