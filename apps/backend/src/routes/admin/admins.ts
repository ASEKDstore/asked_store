import { Router } from 'express'
import { listAdmins, addAdmin, removeAdmin, ROOT_ADMIN_ID } from '../../store/adminsStore.js'

const router = Router()

// GET /api/admin/admins
router.get('/', async (req, res) => {
  try {
    const admins = await listAdmins()
    res.json(admins)
  } catch (error: any) {
    console.error('Error fetching admins:', error)
    res.status(500).json({ error: 'Failed to fetch admins' })
  }
})

// POST /api/admin/admins
router.post('/', async (req, res) => {
  try {
    const { tgId } = req.body
    
    if (!tgId || typeof tgId !== 'number') {
      return res.status(400).json({ error: 'Invalid tgId' })
    }
    
    await addAdmin(tgId)
    res.status(201).json({ success: true, tgId })
  } catch (error: any) {
    console.error('Error adding admin:', error)
    res.status(500).json({ error: 'Failed to add admin' })
  }
})

// DELETE /api/admin/admins/:tgId
router.delete('/:tgId', async (req, res) => {
  try {
    const tgId = parseInt(req.params.tgId, 10)
    
    if (isNaN(tgId)) {
      return res.status(400).json({ error: 'Invalid tgId' })
    }
    
    if (tgId === ROOT_ADMIN_ID) {
      return res.status(400).json({ error: 'Cannot remove root admin' })
    }
    
    await removeAdmin(tgId)
    res.json({ success: true })
  } catch (error: any) {
    console.error('Error removing admin:', error)
    res.status(500).json({ error: error.message || 'Failed to remove admin' })
  }
})

export default router



