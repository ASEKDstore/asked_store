import { Router } from 'express'
import { adminOnly } from '../../middleware/adminOnly.js'
import { testAdminNotifications } from '../../services/telegramNotify.js'

const router = Router()

// POST /api/admin/notifications/test-order
router.post('/test-order', adminOnly, async (req, res) => {
  try {
    const result = await testAdminNotifications()
    res.json({
      success: true,
      sent: result.success,
      failed: result.failed,
      total: result.total,
    })
  } catch (error: any) {
    console.error('Error testing notifications:', error)
    res.status(500).json({ error: 'Failed to test notifications' })
  }
})

export default router

