import { Router } from 'express'
import { prisma } from '../../db/prisma.js'
import { z } from 'zod'

const router = Router()

const ROOT_ADMIN_ID = BigInt(process.env.ROOT_ADMIN_ID || '0')

// GET /api/admin/admins
router.get('/', async (req, res) => {
  try {
    const admins = await prisma.admin.findMany({
      orderBy: { createdAt: 'desc' },
    })
    res.json(admins.map(a => ({
      tgId: a.tgId.toString(),
      name: a.name,
      createdAt: a.createdAt,
    })))
  } catch (error: any) {
    console.error('Error fetching admins:', error)
    res.status(500).json({ error: 'Failed to fetch admins' })
  }
})

// POST /api/admin/admins
router.post('/', async (req, res) => {
  try {
    const { tgId } = req.body
    
    if (!tgId) {
      return res.status(400).json({ error: 'tgId is required' })
    }
    
    const tgIdBigInt = typeof tgId === 'string' ? BigInt(tgId) : BigInt(Number(tgId))
    
    const admin = await prisma.admin.create({
      data: {
        tgId: tgIdBigInt,
        name: req.body.name,
      },
    })
    
    res.status(201).json({ 
      success: true, 
      tgId: admin.tgId.toString(),
      name: admin.name,
    })
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Admin already exists' })
    }
    console.error('Error adding admin:', error)
    res.status(500).json({ error: 'Failed to add admin' })
  }
})

// DELETE /api/admin/admins/:tgId
router.delete('/:tgId', async (req, res) => {
  try {
    const tgId = BigInt(req.params.tgId)
    
    if (tgId === ROOT_ADMIN_ID) {
      return res.status(400).json({ error: 'Cannot remove root admin' })
    }
    
    await prisma.admin.delete({
      where: { tgId },
    })
    
    res.json({ success: true })
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Admin not found' })
    }
    console.error('Error removing admin:', error)
    res.status(500).json({ error: error.message || 'Failed to remove admin' })
  }
})

export default router
