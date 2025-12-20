/**
 * Bot Flow Engine V2
 * Executes published BotFlows with versioning, guards, effects, and transitions
 * Uses Prisma for direct database access (no HTTP calls within monorepo)
 */

import { PrismaClient } from '@prisma/client'
import { Context } from 'telegraf'

// Initialize Prisma client
// Use DATABASE_URL from env (same as backend)
export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
})

// Types
type EntryPoint = string // "command:start", "callback:menu", "text:hello", "webapp:type"

type BotFlowNode = {
  id: string
  title: string
  type: 'MESSAGE' | 'MEDIA' | 'INPUT' | 'ACTION' | 'MENU'
  content: any
  keyboard?: any
  transitions?: any
  guards?: any
  effects?: any
  order: number
}

type BotFlowSnapshot = {
  flow: {
    id: string
    key: string
    name: string
    entryPoints: string[]
    startNodeId: string | null
  }
  nodes: BotFlowNode[]
}

type BotUserState = {
  id: string
  telegramUserId: bigint
  activeFlowId: string | null
  activeFlowVersion: number | null
  currentNodeId: string | null
  context: any
  lastMessageId: number | null
}

/**
 * Parse entry point from Telegram update
 */
export function parseEntryPoint(ctx: Context): EntryPoint | null {
  // Command
  if ('message' in ctx.update && ctx.message && 'text' in ctx.message) {
    const text = ctx.message.text
    if (text.startsWith('/')) {
      const command = text.split(' ')[0].substring(1)
      return `command:${command}`
    }
    // Regular text
    return `text:${text}`
  }
  
  // Callback query
  if ('callback_query' in ctx.update && ctx.callbackQuery) {
    const data = (ctx.callbackQuery as any).data
    if (typeof data === 'string') {
      // Check if it's a flow callback
      if (data.startsWith('flow:')) {
        return `callback:${data}`
      }
      // Regular callback
      return `callback:${data}`
    }
  }
  
  // Web app data
  if ('message' in ctx.update && ctx.message && 'web_app_data' in ctx.message) {
    const webAppData = (ctx.message as any).web_app_data
    return `webapp:${webAppData.data || 'default'}`
  }
  
  return null
}

/**
 * Find published flow by entry point
 */
export async function findFlowByEntryPoint(entryPoint: EntryPoint): Promise<BotFlowSnapshot | null> {
  try {
    // Get all published flows and filter by entryPoints in memory
    // (Prisma JSON array_contains doesn't work well with string arrays)
    const flows = await prisma.botFlow.findMany({
      where: {
        status: 'PUBLISHED',
      },
      include: {
        versions: {
          orderBy: { version: 'desc' },
          take: 1,
        },
      },
    })
    
    // Filter flows that have this entry point
    const matchingFlows = flows.filter(flow => {
      const entryPoints = flow.entryPoints as any
      if (!Array.isArray(entryPoints)) return false
      return entryPoints.includes(entryPoint)
    })
    
    if (matchingFlows.length === 0) {
      return null
    }
    
    const flow = matchingFlows[0]
    const version = flow.versions[0]
    
    if (!version) {
      // Fallback: use current nodes if no version (shouldn't happen for PUBLISHED)
      const nodes = await prisma.botFlowNode.findMany({
        where: { flowId: flow.id },
        orderBy: { order: 'asc' },
      })
      
      return {
        flow: {
          id: flow.id,
          key: flow.key,
          name: flow.name,
          entryPoints: flow.entryPoints as string[],
          startNodeId: flow.startNodeId || null,
        },
        nodes: nodes.map(n => ({
          id: n.id,
          title: n.title,
          type: n.type as any,
          content: n.content as any,
          keyboard: n.keyboard as any,
          transitions: n.transitions as any,
          guards: n.guards as any,
          effects: n.effects as any,
          order: n.order,
        })),
      }
    }
    
    // Use version snapshot
    const snapshot = version.snapshot as any
    return snapshot
  } catch (error) {
    console.error('[FLOW ENGINE] Error finding flow:', error)
    return null
  }
}

/**
 * Get or create user state
 */
export async function getUserState(tgId: number): Promise<BotUserState | null> {
  try {
    let state = await prisma.botUserState.findUnique({
      where: { telegramUserId: BigInt(tgId) },
    })
    
    if (!state) {
      // Create new state
      state = await prisma.botUserState.create({
        data: {
          telegramUserId: BigInt(tgId),
          context: {},
        },
      })
    }
    
    return {
      id: state.id,
      telegramUserId: state.telegramUserId,
      activeFlowId: state.activeFlowId,
      activeFlowVersion: state.activeFlowVersion,
      currentNodeId: state.currentNodeId,
      context: state.context as any,
      lastMessageId: state.lastMessageId,
    }
  } catch (error) {
    console.error('[FLOW ENGINE] Error getting user state:', error)
    return null
  }
}

/**
 * Update user state
 */
export async function updateUserState(
  tgId: number,
  updates: {
    activeFlowId?: string | null
    activeFlowVersion?: number | null
    currentNodeId?: string | null
    context?: any
    lastMessageId?: number | null
  }
): Promise<void> {
  try {
    await prisma.botUserState.upsert({
      where: { telegramUserId: BigInt(tgId) },
      create: {
        telegramUserId: BigInt(tgId),
        activeFlowId: updates.activeFlowId || null,
        activeFlowVersion: updates.activeFlowVersion || null,
        currentNodeId: updates.currentNodeId || null,
        context: updates.context || {},
        lastMessageId: updates.lastMessageId || null,
      },
      update: {
        ...updates,
        context: updates.context || undefined,
      },
    })
  } catch (error) {
    console.error('[FLOW ENGINE] Error updating user state:', error)
  }
}

/**
 * Check guards for node
 */
export async function checkGuards(
  node: BotFlowNode,
  tgId: number,
  context: any
): Promise<{ allowed: boolean; fallbackNodeId?: string }> {
  const guards = node.guards as any
  if (!guards) {
    return { allowed: true }
  }
  
  // Check isAdmin
  if (guards.isAdmin === true) {
    const admin = await prisma.admin.findUnique({
      where: { tgId: BigInt(tgId) },
    })
    if (!admin) {
      return { allowed: false, fallbackNodeId: guards.fallbackNodeId }
    }
  }
  
  // Check isSubscribed
  if (guards.isSubscribed === true) {
    const subscriber = await prisma.telegramSubscriber.findUnique({
      where: { tgId: BigInt(tgId) },
    })
    if (!subscriber || !subscriber.isActive) {
      return { allowed: false, fallbackNodeId: guards.fallbackNodeId }
    }
  }
  
  // Check flags
  if (guards.flags) {
    for (const [key, value] of Object.entries(guards.flags)) {
      if (context[key] !== value) {
        return { allowed: false, fallbackNodeId: guards.fallbackNodeId }
      }
    }
  }
  
  return { allowed: true }
}

/**
 * Execute effects for node
 */
export async function executeEffects(
  node: BotFlowNode,
  tgId: number,
  context: any
): Promise<{ updatedContext: any; shouldNotifyAdmin: boolean }> {
  const effects = node.effects as any
  if (!effects) {
    return { updatedContext: context, shouldNotifyAdmin: false }
  }
  
  let updatedContext = { ...context }
  let shouldNotifyAdmin = false
  
  // Set flag
  if (effects.setFlag) {
    updatedContext = { ...updatedContext, ...effects.setFlag }
  }
  
  // Log event
  if (effects.logEvent) {
    console.log('[FLOW ENGINE] Event:', effects.logEvent, { tgId, nodeId: node.id })
  }
  
  // Notify admin
  if (effects.notifyAdmin === true) {
    shouldNotifyAdmin = true
  }
  
  // API call (can be implemented later)
  if (effects.apiCall) {
    // TODO: Make API call
    console.log('[FLOW ENGINE] API call effect:', effects.apiCall)
  }
  
  return { updatedContext, shouldNotifyAdmin }
}

/**
 * Find next node based on transitions
 */
export function findNextNode(
  node: BotFlowNode,
  event: { type: 'button' | 'text' | 'callback'; data?: any },
  flow: BotFlowSnapshot
): string | null {
  const transitions = node.transitions as any
  if (!transitions || !transitions.rules) {
    return transitions?.fallback || null
  }
  
  // Check rules
  for (const rule of transitions.rules) {
    if (rule.on === 'button' && event.type === 'button' && rule.buttonId === event.data?.buttonId) {
      return rule.goto
    }
    
    if (rule.on === 'text' && event.type === 'text') {
      const text = event.data?.text || ''
      if (rule.pattern === 'equals' && text === rule.value) {
        return rule.goto
      }
      if (rule.pattern === 'contains' && text.includes(rule.value)) {
        return rule.goto
      }
      if (rule.pattern === 'regex' && new RegExp(rule.value).test(text)) {
        return rule.goto
      }
    }
    
    if (rule.on === 'callback' && event.type === 'callback' && rule.callbackData === event.data?.callbackData) {
      return rule.goto
    }
  }
  
  // Fallback
  return transitions.fallback || null
}

/**
 * Get node by ID from flow
 */
export function getNodeById(flow: BotFlowSnapshot, nodeId: string): BotFlowNode | null {
  return flow.nodes.find(n => n.id === nodeId) || null
}

/**
 * Start flow for user
 */
export async function startFlow(
  tgId: number,
  flow: BotFlowSnapshot,
  version: number
): Promise<{ node: BotFlowNode | null; error?: string }> {
  const startNodeId = flow.flow.startNodeId || flow.nodes[0]?.id
  if (!startNodeId) {
    return { node: null, error: 'Flow has no start node' }
  }
  
  const startNode = getNodeById(flow, startNodeId)
  if (!startNode) {
    return { node: null, error: `Start node ${startNodeId} not found` }
  }
  
  // Check guards
  const guardCheck = await checkGuards(startNode, tgId, {})
  if (!guardCheck.allowed) {
    if (guardCheck.fallbackNodeId) {
      const fallbackNode = getNodeById(flow, guardCheck.fallbackNodeId)
      if (fallbackNode) {
        await updateUserState(tgId, {
          activeFlowId: flow.flow.id,
          activeFlowVersion: version,
          currentNodeId: fallbackNodeId,
          context: {},
        })
        return { node: fallbackNode }
      }
    }
    return { node: null, error: 'Access denied by guards' }
  }
  
  // Update state
  await updateUserState(tgId, {
    activeFlowId: flow.flow.id,
    activeFlowVersion: version,
    currentNodeId: startNodeId,
    context: {},
  })
  
  return { node: startNode }
}

/**
 * Process event and transition to next node
 */
export async function processEvent(
  tgId: number,
  event: { type: 'button' | 'text' | 'callback'; data?: any }
): Promise<{ node: BotFlowNode | null; error?: string }> {
  const state = await getUserState(tgId)
  if (!state || !state.activeFlowId || !state.currentNodeId) {
    return { node: null, error: 'No active flow' }
  }
  
  // Load flow version
  const flowRecord = await prisma.botFlow.findUnique({
    where: { id: state.activeFlowId },
    include: {
      versions: {
        where: { version: state.activeFlowVersion || undefined },
        take: 1,
      },
    },
  })
  
  if (!flowRecord) {
    return { node: null, error: 'Flow not found' }
  }
  
  let flow: BotFlowSnapshot
  if (flowRecord.versions.length > 0) {
    flow = flowRecord.versions[0].snapshot as any
  } else {
    // Fallback: use current nodes
    const nodes = await prisma.botFlowNode.findMany({
      where: { flowId: state.activeFlowId },
      orderBy: { order: 'asc' },
    })
    flow = {
      flow: {
        id: flowRecord.id,
        key: flowRecord.key,
        name: flowRecord.name,
        entryPoints: flowRecord.entryPoints as string[],
        startNodeId: flowRecord.startNodeId || null,
      },
      nodes: nodes.map(n => ({
        id: n.id,
        title: n.title,
        type: n.type as any,
        content: n.content as any,
        keyboard: n.keyboard as any,
        transitions: n.transitions as any,
        guards: n.guards as any,
        effects: n.effects as any,
        order: n.order,
      })),
    }
  }
  
  // Get current node
  const currentNode = getNodeById(flow, state.currentNodeId)
  if (!currentNode) {
    return { node: null, error: `Current node ${state.currentNodeId} not found` }
  }
  
  // Find next node
  const nextNodeId = findNextNode(currentNode, event, flow)
  if (!nextNodeId) {
    return { node: null, error: 'No transition found' }
  }
  
  const nextNode = getNodeById(flow, nextNodeId)
  if (!nextNode) {
    return { node: null, error: `Next node ${nextNodeId} not found` }
  }
  
  // Check guards
  const guardCheck = await checkGuards(nextNode, tgId, state.context)
  if (!guardCheck.allowed) {
    if (guardCheck.fallbackNodeId) {
      const fallbackNode = getNodeById(flow, guardCheck.fallbackNodeId)
      if (fallbackNode) {
        // Execute effects from current node
        const { updatedContext } = await executeEffects(currentNode, tgId, state.context)
        
        await updateUserState(tgId, {
          currentNodeId: guardCheck.fallbackNodeId,
          context: updatedContext,
        })
        return { node: fallbackNode }
      }
    }
    return { node: null, error: 'Access denied by guards' }
  }
  
  // Execute effects from current node
  const { updatedContext, shouldNotifyAdmin } = await executeEffects(currentNode, tgId, state.context)
  
  // Update state
  await updateUserState(tgId, {
    currentNodeId: nextNodeId,
    context: updatedContext,
  })
  
  // Notify admin if needed
  if (shouldNotifyAdmin) {
    // TODO: Send notification to admin
    console.log('[FLOW ENGINE] Should notify admin for user', tgId)
  }
  
  return { node: nextNode }
}

/**
 * Cleanup Prisma connection
 */
export async function disconnect(): Promise<void> {
  await prisma.$disconnect()
}

