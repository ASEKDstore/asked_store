/**
 * Bot Flow Preview API
 * Simulates flow execution without Telegram
 */

import { Router, Request, Response, NextFunction } from 'express'
import { prisma } from '../../db/prisma.js'
import { z } from 'zod'
import { adminOnly } from '../../middleware/adminOnly.js'

const router = Router()

const PreviewRequestSchema = z.object({
  flowId: z.string().uuid(),
  version: z.union([z.literal('draft'), z.number().int().positive()]).optional(),
  state: z.object({
    currentNodeId: z.string().uuid().optional(),
    context: z.any().optional(),
  }).optional(),
  event: z.object({
    type: z.enum(['start', 'button', 'text', 'callback']),
    data: z.any().optional(), // buttonId, text, callbackData, etc
  }),
})

// POST /api/admin/bot/preview/run
router.post('/run', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { flowId, version, state, event } = PreviewRequestSchema.parse(req.body)
    
    // Load flow
    let flow: any
    if (version === 'draft' || !version) {
      // Load draft
      flow = await prisma.botFlow.findUnique({
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
    } else {
      // Load published version
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
      flow = {
        ...snapshot.flow,
        nodes: snapshot.nodes || [],
      }
    }
    
    // Determine current node
    let currentNodeId = state?.currentNodeId || flow.startNodeId || flow.nodes[0]?.id
    if (!currentNodeId) {
      return res.status(400).json({ message: 'Flow has no start node' })
    }
    
    let currentNode = flow.nodes.find((n: any) => n.id === currentNodeId)
    if (!currentNode) {
      return res.status(400).json({ message: `Node ${currentNodeId} not found` })
    }
    
    // Process event
    if (event.type === 'start') {
      // Start flow - already at start node
    } else if (event.type === 'button') {
      // Button click - find transition
      const transitions = currentNode.transitions as any
      if (transitions?.rules) {
        const rule = transitions.rules.find((r: any) => 
          r.on === 'button' && r.buttonId === event.data?.buttonId
        )
        if (rule?.goto) {
          currentNodeId = rule.goto
          currentNode = flow.nodes.find((n: any) => n.id === currentNodeId)
        }
      }
    } else if (event.type === 'text') {
      // Text input - find matching transition
      const transitions = currentNode.transitions as any
      if (transitions?.rules) {
        const text = event.data?.text || ''
        for (const rule of transitions.rules) {
          if (rule.on === 'text') {
            if (rule.pattern === 'equals' && text === rule.value) {
              currentNodeId = rule.goto
              currentNode = flow.nodes.find((n: any) => n.id === currentNodeId)
              break
            } else if (rule.pattern === 'contains' && text.includes(rule.value)) {
              currentNodeId = rule.goto
              currentNode = flow.nodes.find((n: any) => n.id === currentNodeId)
              break
            } else if (rule.pattern === 'regex' && new RegExp(rule.value).test(text)) {
              currentNodeId = rule.goto
              currentNode = flow.nodes.find((n: any) => n.id === currentNodeId)
              break
            }
          }
        }
        // If no match, use fallback
        if (currentNodeId === state?.currentNodeId && transitions?.fallback) {
          currentNodeId = transitions.fallback
          currentNode = flow.nodes.find((n: any) => n.id === currentNodeId)
        }
      }
    }
    
    // Check guards (simplified - no actual user/admin check in preview)
    const guards = currentNode.guards as any
    if (guards) {
      // In preview, we skip guards or show warning
      // In real execution, guards would block transition
    }
    
    // Build bot output
    const content = currentNode.content as any
    const keyboard = currentNode.keyboard as any
    const effects = currentNode.effects as any
    
    const botOutput: any = {
      text: content?.text || '',
      parseMode: content?.parseMode,
      mediaUrl: content?.mediaUrl,
      keyboard: keyboard ? {
        type: keyboard.type,
        buttons: keyboard.buttons || [],
      } : null,
      effects: effects ? {
        logEvent: effects.logEvent,
        notifyAdmin: effects.notifyAdmin,
        setFlag: effects.setFlag,
        deleteAfterMs: effects.deleteAfterMs,
        editAnimation: effects.editMessageAnimation,
      } : null,
    }
    
    // Build next state
    const nextState = {
      currentNodeId,
      context: {
        ...(state?.context || {}),
        ...(effects?.setFlag || {}),
      },
    }
    
    res.json({
      nextState,
      botOutput,
      nodeId: currentNodeId,
      nodeTitle: currentNode.title,
    })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: error.errors })
    }
    console.error('[BOT PREVIEW] Error:', error)
    next(error)
  }
})

export default router

