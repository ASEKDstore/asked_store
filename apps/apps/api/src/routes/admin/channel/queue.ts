// Admin channel queue routes

import { Router, Request, Response } from 'express'
import { prisma } from '../../../prisma.js'
import {
  ChannelQueueItemDTO,
  CreateChannelQueueRequestDTO,
  createChannelQueueRequestSchema,
  ApiError,
} from '@asked-store/shared'
import { z } from 'zod'

const router = Router()

/**
 * POST /admin/channel/queue
 * Create a new channel queue item
 * Requires 'admin.access' permission
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const validationResult = createChannelQueueRequestSchema.safeParse(req.body)
    if (!validationResult.success) {
      res.status(400).json({
        error: 'Invalid request body',
        details: validationResult.error.errors,
      } as ApiError)
      return
    }

    const data = validationResult.data

    // Parse scheduledAt if provided
    let scheduledAt: Date | null = null
    if (data.scheduledAt) {
      scheduledAt = new Date(data.scheduledAt)
      if (isNaN(scheduledAt.getTime())) {
        res.status(400).json({
          error: 'Invalid scheduledAt date format',
        } as ApiError)
        return
      }
    }

    // Create queue item
    const queueItem = await prisma.channelQueue.create({
      data: {
        payload: {
          templateKey: data.templateKey,
          variables: data.variables,
          content: data.content,
          buttons: data.buttons,
        },
        scheduledAt: scheduledAt,
      },
    })

    const queueItemDTO: ChannelQueueItemDTO = {
      id: queueItem.id,
      payload: queueItem.payload as any,
      status: queueItem.status as 'queued' | 'sent' | 'failed',
      scheduledAt: queueItem.scheduledAt?.toISOString() || null,
      sentAt: queueItem.sentAt?.toISOString() || null,
      messageId: queueItem.messageId,
      attempts: queueItem.attempts,
      lastError: queueItem.lastError,
      createdAt: queueItem.createdAt.toISOString(),
      updatedAt: queueItem.updatedAt.toISOString(),
    }

    res.status(201).json(queueItemDTO)
  } catch (error) {
    console.error('Error creating channel queue item:', error)
    res.status(500).json({ error: 'Failed to create channel queue item' } as ApiError)
  }
})

/**
 * GET /admin/channel/queue
 * Get channel queue items
 * Requires 'admin.access' permission
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    // Optional query params for filtering
    const status = req.query.status as string | undefined

    const where: any = {}
    if (status && ['queued', 'sent', 'failed'].includes(status)) {
      where.status = status
    }

    const queueItems = await prisma.channelQueue.findMany({
      where,
      orderBy: [
        { scheduledAt: 'asc' },
        { createdAt: 'asc' },
      ],
    })

    const queueItemDTOs: ChannelQueueItemDTO[] = queueItems.map((item) => ({
      id: item.id,
      payload: item.payload as any,
      status: item.status as 'queued' | 'sent' | 'failed',
      scheduledAt: item.scheduledAt?.toISOString() || null,
      sentAt: item.sentAt?.toISOString() || null,
      messageId: item.messageId,
      attempts: item.attempts,
      lastError: item.lastError,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    }))

    res.json(queueItemDTOs)
  } catch (error) {
    console.error('Error fetching channel queue items:', error)
    res.status(500).json({ error: 'Failed to fetch channel queue items' } as ApiError)
  }
})

/**
 * POST /admin/channel/queue/:id/cancel
 * Cancel a queued item (only if status is 'queued')
 * Requires 'admin.access' permission
 */
router.post('/:id/cancel', async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    // Find the queue item
    const queueItem = await prisma.channelQueue.findUnique({
      where: { id },
    })

    if (!queueItem) {
      res.status(404).json({ error: 'Queue item not found' } as ApiError)
      return
    }

    if (queueItem.status !== 'queued') {
      res.status(400).json({
        error: 'Only queued items can be cancelled',
        currentStatus: queueItem.status,
      } as ApiError)
      return
    }

    // Update status to failed with cancellation message
    const updated = await prisma.channelQueue.update({
      where: { id },
      data: {
        status: 'failed',
        lastError: 'Cancelled by admin',
      },
    })

    const queueItemDTO: ChannelQueueItemDTO = {
      id: updated.id,
      payload: updated.payload as any,
      status: updated.status as 'queued' | 'sent' | 'failed',
      scheduledAt: updated.scheduledAt?.toISOString() || null,
      sentAt: updated.sentAt?.toISOString() || null,
      messageId: updated.messageId,
      attempts: updated.attempts,
      lastError: updated.lastError,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    }

    res.json(queueItemDTO)
  } catch (error) {
    console.error('Error cancelling channel queue item:', error)
    res.status(500).json({ error: 'Failed to cancel channel queue item' } as ApiError)
  }
})

export { router as channelQueueRouter }

