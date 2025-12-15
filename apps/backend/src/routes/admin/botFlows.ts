import { Router, Request, Response, NextFunction } from 'express'
import { prisma } from '../../db/prisma.js'
import { z } from 'zod'

const router = Router()

const BotFlowStepSchema = z.object({
  order: z.number().int(),
  type: z.enum(['TEXT', 'PHOTO', 'MEDIA', 'BUTTONS']),
  payload: z.any(), // JSON payload
})

const CreateBotFlowSchema = z.object({
  key: z.string().min(1),
  name: z.string().min(1),
  isActive: z.boolean().default(true),
  steps: z.array(BotFlowStepSchema).min(1),
})

// GET /api/admin/bot/flows
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const flows = await prisma.botFlow.findMany({
      include: {
        steps: {
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { updatedAt: 'desc' },
    })
    
    res.json(flows.map(f => ({
      id: f.id,
      key: f.key,
      name: f.name,
      isActive: f.isActive,
      createdAt: f.createdAt,
      updatedAt: f.updatedAt,
      steps: f.steps,
    })))
  } catch (error: any) {
    console.error('[BOT FLOWS] Error fetching list:', error)
    next(error)
  }
})

// GET /api/admin/bot/flows/:id
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const flow = await prisma.botFlow.findUnique({
      where: { id: req.params.id },
      include: {
        steps: {
          orderBy: { order: 'asc' },
        },
      },
    })
    
    if (!flow) {
      return res.status(404).json({ message: 'Flow not found' })
    }
    
    res.json(flow)
  } catch (error: any) {
    console.error('[BOT FLOWS] Error fetching flow:', error)
    next(error)
  }
})

// POST /api/admin/bot/flows
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = CreateBotFlowSchema.parse(req.body)
    
    const flow = await prisma.botFlow.create({
      data: {
        key: data.key,
        name: data.name,
        isActive: data.isActive,
        steps: {
          create: data.steps.map((step, idx) => ({
            order: step.order ?? idx,
            type: step.type,
            payload: step.payload,
          })),
        },
      },
      include: {
        steps: {
          orderBy: { order: 'asc' },
        },
      },
    })
    
    console.log('[BOT FLOWS] Created flow:', flow.id, flow.name)
    res.status(201).json(flow)
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(400).json({ message: `Flow with key "${req.body.key}" already exists` })
    }
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: error.errors })
    }
    console.error('[BOT FLOWS] Error creating flow:', error)
    next(error)
  }
})

// PUT /api/admin/bot/flows/:id
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const flowId = req.params.id
    const data = CreateBotFlowSchema.partial().parse(req.body)
    
    // Delete existing steps
    await prisma.botFlowStep.deleteMany({
      where: { flowId },
    })
    
    const flow = await prisma.botFlow.update({
      where: { id: flowId },
      data: {
        name: data.name,
        isActive: data.isActive,
        steps: data.steps ? {
          create: data.steps.map((step, idx) => ({
            order: step.order ?? idx,
            type: step.type,
            payload: step.payload,
          })),
        } : undefined,
      },
      include: {
        steps: {
          orderBy: { order: 'asc' },
        },
      },
    })
    
    console.log('[BOT FLOWS] Updated flow:', flowId, flow.name)
    res.json(flow)
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Flow not found' })
    }
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: error.errors })
    }
    console.error('[BOT FLOWS] Error updating flow:', error)
    next(error)
  }
})

// DELETE /api/admin/bot/flows/:id
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const flowId = req.params.id
    
    await prisma.botFlow.delete({
      where: { id: flowId },
    })
    
    console.log('[BOT FLOWS] Deleted flow:', flowId)
    res.json({ ok: true })
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Flow not found' })
    }
    console.error('[BOT FLOWS] Error deleting flow:', error)
    next(error)
  }
})

export default router
