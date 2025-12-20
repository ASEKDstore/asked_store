/**
 * Extended Bot Flows API with versioning, publish, rollback, preview
 * This extends the existing botFlows.ts router
 */

import { Router, Request, Response, NextFunction } from 'express'
import { prisma } from '../../db/prisma.js'
import { z } from 'zod'
import { adminOnly } from '../../middleware/adminOnly.js'

const router = Router()

// Zod schemas for new API
const BotFlowNodeSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(1),
  type: z.enum(['MESSAGE', 'MEDIA', 'INPUT', 'ACTION', 'MENU']),
  content: z.any(), // JSON
  keyboard: z.any().optional(), // JSON
  transitions: z.any().optional(), // JSON
  guards: z.any().optional(), // JSON
  effects: z.any().optional(), // JSON
  order: z.number().int().default(0),
})

const CreateFlowSchema = z.object({
  key: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  entryPoints: z.array(z.string()).default([]), // ["command:start", "callback:menu"]
  startNodeId: z.string().uuid().optional(),
  nodes: z.array(BotFlowNodeSchema).default([]),
})

const UpdateFlowSchema = CreateFlowSchema.partial()

// GET /api/admin/bot/flows (extended - includes nodes and versions)
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const flows = await prisma.botFlow.findMany({
      include: {
        nodes: {
          orderBy: { order: 'asc' },
        },
        versions: {
          orderBy: { version: 'desc' },
          take: 1, // Latest version
        },
        _count: {
          select: { nodes: true, versions: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    })
    
    res.json(flows.map(f => ({
      id: f.id,
      key: f.key,
      name: f.name,
      description: f.description,
      status: f.status,
      version: f.version,
      entryPoints: f.entryPoints,
      startNodeId: f.startNodeId,
      isActive: f.isActive, // Legacy
      createdAt: f.createdAt,
      updatedAt: f.updatedAt,
      publishedAt: f.publishedAt,
      nodes: f.nodes,
      latestVersion: f.versions[0] || null,
      _count: f._count,
    })))
  } catch (error: any) {
    console.error('[BOT FLOWS] Error fetching list:', error)
    next(error)
  }
})

// GET /api/admin/bot/flows/:id (with nodes)
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const flow = await prisma.botFlow.findUnique({
      where: { id: req.params.id },
      include: {
        nodes: {
          orderBy: { order: 'asc' },
        },
        versions: {
          orderBy: { version: 'desc' },
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

// POST /api/admin/bot/flows (create with nodes)
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = CreateFlowSchema.parse(req.body)
    const user = (req as any).user // From adminOnly middleware
    
    const flow = await prisma.botFlow.create({
      data: {
        key: data.key,
        name: data.name,
        description: data.description,
        status: 'DRAFT',
        version: 0,
        entryPoints: data.entryPoints,
        startNodeId: data.startNodeId,
        nodes: {
          create: data.nodes.map((node, idx) => ({
            title: node.title,
            type: node.type,
            content: node.content,
            keyboard: node.keyboard || null,
            transitions: node.transitions || null,
            guards: node.guards || null,
            effects: node.effects || null,
            order: node.order ?? idx,
          })),
        },
      },
      include: {
        nodes: {
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

// PUT /api/admin/bot/flows/:id (update with nodes)
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const flowId = req.params.id
    const data = UpdateFlowSchema.parse(req.body)
    
    // Only allow updating DRAFT flows
    const existing = await prisma.botFlow.findUnique({
      where: { id: flowId },
    })
    
    if (!existing) {
      return res.status(404).json({ message: 'Flow not found' })
    }
    
    if (existing.status === 'PUBLISHED' && data.nodes) {
      return res.status(400).json({ 
        message: 'Cannot update nodes of published flow. Create a new version or rollback first.' 
      })
    }
    
    // Delete existing nodes if nodes are being updated
    if (data.nodes) {
      await prisma.botFlowNode.deleteMany({
        where: { flowId },
      })
    }
    
    const flow = await prisma.botFlow.update({
      where: { id: flowId },
      data: {
        name: data.name,
        description: data.description,
        entryPoints: data.entryPoints,
        startNodeId: data.startNodeId,
        nodes: data.nodes ? {
          create: data.nodes.map((node, idx) => ({
            title: node.title,
            type: node.type,
            content: node.content,
            keyboard: node.keyboard || null,
            transitions: node.transitions || null,
            guards: node.guards || null,
            effects: node.effects || null,
            order: node.order ?? idx,
          })),
        } : undefined,
      },
      include: {
        nodes: {
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

// POST /api/admin/bot/flows/:id/duplicate
router.post('/:id/duplicate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const flowId = req.params.id
    const { key, name } = z.object({
      key: z.string().min(1).optional(),
      name: z.string().min(1).optional(),
    }).parse(req.body)
    
    const original = await prisma.botFlow.findUnique({
      where: { id: flowId },
      include: {
        nodes: {
          orderBy: { order: 'asc' },
        },
      },
    })
    
    if (!original) {
      return res.status(404).json({ message: 'Flow not found' })
    }
    
    const newFlow = await prisma.botFlow.create({
      data: {
        key: key || `${original.key}_copy_${Date.now()}`,
        name: name || `${original.name} (Copy)`,
        description: original.description,
        status: 'DRAFT',
        version: 0,
        entryPoints: original.entryPoints as any,
        startNodeId: original.startNodeId,
        nodes: {
          create: original.nodes.map(node => ({
            title: node.title,
            type: node.type,
            content: node.content,
            keyboard: node.keyboard,
            transitions: node.transitions,
            guards: node.guards,
            effects: node.effects,
            order: node.order,
          })),
        },
      },
      include: {
        nodes: {
          orderBy: { order: 'asc' },
        },
      },
    })
    
    console.log('[BOT FLOWS] Duplicated flow:', flowId, '->', newFlow.id)
    res.status(201).json(newFlow)
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(400).json({ message: `Flow with key "${req.body.key}" already exists` })
    }
    console.error('[BOT FLOWS] Error duplicating flow:', error)
    next(error)
  }
})

// Validation function for publish
async function validateFlowForPublish(flowId: string): Promise<{ valid: boolean; errors: string[] }> {
  const errors: string[] = []
  
  const flow = await prisma.botFlow.findUnique({
    where: { id: flowId },
    include: {
      nodes: true,
    },
  })
  
  if (!flow) {
    return { valid: false, errors: ['Flow not found'] }
  }
  
  if (flow.nodes.length === 0) {
    errors.push('Flow must have at least one node')
  }
  
  if (flow.startNodeId) {
    const startNode = flow.nodes.find(n => n.id === flow.startNodeId)
    if (!startNode) {
      errors.push(`Start node ${flow.startNodeId} not found`)
    }
  } else if (flow.nodes.length > 0) {
    // Auto-set first node as start if not set
    flow.startNodeId = flow.nodes[0].id
  }
  
  // Validate transitions
  for (const node of flow.nodes) {
    const transitions = node.transitions as any
    if (transitions?.rules) {
      for (const rule of transitions.rules) {
        if (rule.goto) {
          const targetNode = flow.nodes.find(n => n.id === rule.goto)
          if (!targetNode) {
            errors.push(`Node ${node.id}: transition points to non-existent node ${rule.goto}`)
          }
        }
      }
    }
    if (transitions?.fallback) {
      const targetNode = flow.nodes.find(n => n.id === transitions.fallback)
      if (!targetNode) {
        errors.push(`Node ${node.id}: fallback points to non-existent node ${transitions.fallback}`)
      }
    }
  }
  
  // Validate entryPoints conflicts with other PUBLISHED flows
  if (Array.isArray(flow.entryPoints) && flow.entryPoints.length > 0) {
    const conflicting = await prisma.botFlow.findFirst({
      where: {
        id: { not: flowId },
        status: 'PUBLISHED',
        entryPoints: {
          path: [],
          array_contains: flow.entryPoints,
        },
      },
    })
    
    if (conflicting) {
      errors.push(`Entry points conflict with published flow "${conflicting.name}" (${conflicting.id})`)
    }
  }
  
  // Validate Telegram limits
  for (const node of flow.nodes) {
    const content = node.content as any
    if (content?.text && content.text.length > 4096) {
      errors.push(`Node ${node.id}: text exceeds 4096 characters`)
    }
    
    const keyboard = node.keyboard as any
    if (keyboard?.buttons) {
      for (const row of keyboard.buttons) {
        if (row.length > 3) {
          errors.push(`Node ${node.id}: button row has more than 3 buttons (Telegram limit)`)
        }
        for (const btn of row) {
          if (btn.callback_data && btn.callback_data.length > 64) {
            errors.push(`Node ${node.id}: callback_data exceeds 64 bytes`)
          }
        }
      }
    }
    
    const effects = node.effects as any
    if (effects?.editMessageAnimation?.frames && effects.editMessageAnimation.frames.length > 8) {
      errors.push(`Node ${node.id}: edit animation has more than 8 frames (safety limit)`)
    }
  }
  
  return { valid: errors.length === 0, errors }
}

// POST /api/admin/bot/flows/:id/publish
router.post('/:id/publish', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const flowId = req.params.id
    const user = (req as any).user
    
    const flow = await prisma.botFlow.findUnique({
      where: { id: flowId },
      include: {
        nodes: {
          orderBy: { order: 'asc' },
        },
      },
    })
    
    if (!flow) {
      return res.status(404).json({ message: 'Flow not found' })
    }
    
    // Validate
    const validation = await validateFlowForPublish(flowId)
    if (!validation.valid) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: validation.errors,
      })
    }
    
    // Auto-set startNodeId if not set
    let startNodeId = flow.startNodeId
    if (!startNodeId && flow.nodes.length > 0) {
      startNodeId = flow.nodes[0].id
    }
    
    // Create snapshot and publish in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create version snapshot
      const newVersion = flow.version + 1
      const snapshot = {
        flow: {
          id: flow.id,
          key: flow.key,
          name: flow.name,
          description: flow.description,
          entryPoints: flow.entryPoints,
          startNodeId: startNodeId,
        },
        nodes: flow.nodes.map(n => ({
          id: n.id,
          title: n.title,
          type: n.type,
          content: n.content,
          keyboard: n.keyboard,
          transitions: n.transitions,
          guards: n.guards,
          effects: n.effects,
          order: n.order,
        })),
      }
      
      // Create version record
      await tx.botFlowVersion.create({
        data: {
          flowId: flowId,
          version: newVersion,
          snapshot: snapshot as any,
          publishedByTgId: user?.tgId ? BigInt(user.tgId) : null,
        },
      })
      
      // Update flow status
      const updated = await tx.botFlow.update({
        where: { id: flowId },
        data: {
          status: 'PUBLISHED',
          version: newVersion,
          publishedAt: new Date(),
          startNodeId: startNodeId,
        },
        include: {
          nodes: {
            orderBy: { order: 'asc' },
          },
          versions: {
            orderBy: { version: 'desc' },
            take: 1,
          },
        },
      })
      
      return updated
    })
    
    console.log('[BOT FLOWS] Published flow:', flowId, 'version', result.version)
    res.json(result)
  } catch (error: any) {
    console.error('[BOT FLOWS] Error publishing flow:', error)
    next(error)
  }
})

// POST /api/admin/bot/flows/:id/rollback
router.post('/:id/rollback', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const flowId = req.params.id
    const { version } = z.object({
      version: z.number().int().positive(),
    }).parse(req.body)
    
    const versionRecord = await prisma.botFlowVersion.findUnique({
      where: {
        flowId_version: {
          flowId,
          version,
        },
      },
    })
    
    if (!versionRecord) {
      return res.status(404).json({ message: `Version ${version} not found` })
    }
    
    const snapshot = versionRecord.snapshot as any
    
    // Restore flow and nodes from snapshot
    await prisma.$transaction(async (tx) => {
      // Delete current nodes
      await tx.botFlowNode.deleteMany({
        where: { flowId },
      })
      
      // Restore nodes
      if (snapshot.nodes && Array.isArray(snapshot.nodes)) {
        await tx.botFlowNode.createMany({
          data: snapshot.nodes.map((node: any) => ({
            flowId,
            title: node.title,
            type: node.type,
            content: node.content,
            keyboard: node.keyboard || null,
            transitions: node.transitions || null,
            guards: node.guards || null,
            effects: node.effects || null,
            order: node.order || 0,
          })),
        })
      }
      
      // Update flow
      await tx.botFlow.update({
        where: { id: flowId },
        data: {
          status: 'PUBLISHED',
          version: version,
          startNodeId: snapshot.flow?.startNodeId || null,
          entryPoints: snapshot.flow?.entryPoints || [],
        },
      })
    })
    
    console.log('[BOT FLOWS] Rolled back flow:', flowId, 'to version', version)
    res.json({ ok: true, version })
  } catch (error: any) {
    console.error('[BOT FLOWS] Error rolling back flow:', error)
    next(error)
  }
})

// POST /api/admin/bot/flows/:id/archive
router.post('/:id/archive', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const flowId = req.params.id
    
    const flow = await prisma.botFlow.update({
      where: { id: flowId },
      data: {
        status: 'ARCHIVED',
      },
    })
    
    console.log('[BOT FLOWS] Archived flow:', flowId)
    res.json(flow)
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Flow not found' })
    }
    console.error('[BOT FLOWS] Error archiving flow:', error)
    next(error)
  }
})

// GET /api/admin/bot/flows/:id/nodes
router.get('/:id/nodes', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const nodes = await prisma.botFlowNode.findMany({
      where: { flowId: req.params.id },
      orderBy: { order: 'asc' },
    })
    
    res.json(nodes)
  } catch (error: any) {
    console.error('[BOT FLOWS] Error fetching nodes:', error)
    next(error)
  }
})

// PUT /api/admin/bot/flows/:id/nodes (bulk save)
router.put('/:id/nodes', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const flowId = req.params.id
    const nodes = z.array(BotFlowNodeSchema).parse(req.body)
    
    // Check flow exists and is DRAFT
    const flow = await prisma.botFlow.findUnique({
      where: { id: flowId },
    })
    
    if (!flow) {
      return res.status(404).json({ message: 'Flow not found' })
    }
    
    if (flow.status === 'PUBLISHED') {
      return res.status(400).json({ 
        message: 'Cannot update nodes of published flow. Create a new version or rollback first.' 
      })
    }
    
    // Delete existing nodes
    await prisma.botFlowNode.deleteMany({
      where: { flowId },
    })
    
    // Create new nodes
    const created = await prisma.botFlowNode.createMany({
      data: nodes.map((node, idx) => ({
        flowId,
        title: node.title,
        type: node.type,
        content: node.content,
        keyboard: node.keyboard || null,
        transitions: node.transitions || null,
        guards: node.guards || null,
        effects: node.effects || null,
        order: node.order ?? idx,
      })),
    })
    
    // Fetch created nodes
    const result = await prisma.botFlowNode.findMany({
      where: { flowId },
      orderBy: { order: 'asc' },
    })
    
    res.json(result)
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: error.errors })
    }
    console.error('[BOT FLOWS] Error saving nodes:', error)
    next(error)
  }
})

export default router

