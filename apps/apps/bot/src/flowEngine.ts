// Локальные типы для бота
type BotFlow = {
  id: string
  name: string
  trigger: 'start' | 'menu' | 'help' | 'custom'
  startStepId: string
  enabled: boolean
  steps: BotStep[]
  updatedAt: string
}

type BotStep = {
  id: string
  name: string
  content: BotStepContent
  buttons?: BotButton[]
}

type BotStepContent =
  | { type: 'message'; text: string; parseMode?: 'HTML' | 'MarkdownV2'; entitiesJson?: any }
  | { type: 'photo'; imageUrl: string; caption?: string; parseMode?: 'HTML' | 'MarkdownV2'; entitiesJson?: any }

type BotButton = {
  id: string
  text: string
  kind: 'next' | 'url' | 'action'
  nextStepId?: string
  url?: string
  action?: string
}

const BACKEND_API_URL = process.env.BACKEND_API_URL || process.env.API_URL || 'http://localhost:4000'
const FLOWS_KEY = 'botFlows'
const USER_STATES_KEY = 'botUserStates'

// Кеш flows в памяти
let flowsCache: BotFlow[] | null = null
let cacheTimestamp = 0
const CACHE_TTL = 30000 // 30 секунд

/**
 * Загрузить flows с backend API
 */
async function loadFlows(): Promise<BotFlow[]> {
  try {
    const response = await fetch(`${BACKEND_API_URL}/api/admin/bot/flows`)
    if (!response.ok) {
      console.error('[FLOW ENGINE] Failed to load flows:', response.statusText)
      return []
    }
    const flows = await response.json()
    return flows
  } catch (error) {
    console.error('[FLOW ENGINE] Error loading flows:', error)
    return []
  }
}

/**
 * Получить flows (с кешированием)
 */
export async function getFlows(): Promise<BotFlow[]> {
  const now = Date.now()
  if (flowsCache && (now - cacheTimestamp) < CACHE_TTL) {
    return flowsCache
  }
  
  flowsCache = await loadFlows()
  cacheTimestamp = now
  return flowsCache
}

/**
 * Получить enabled flow по триггеру
 */
export async function getFlowByTrigger(trigger: BotFlow['trigger']): Promise<BotFlow | null> {
  const flows = await getFlows()
  return flows.find(f => f.enabled && f.trigger === trigger) || null
}

/**
 * Получить flow по ID
 */
export async function getFlowById(flowId: string): Promise<BotFlow | null> {
  const flows = await getFlows()
  return flows.find(f => f.id === flowId) || null
}

/**
 * Получить шаг из flow
 */
export function getStepFromFlow(flow: BotFlow, stepId: string): BotStep | null {
  return flow.steps.find(s => s.id === stepId) || null
}

/**
 * Обновить состояние пользователя
 */
export async function updateUserState(tgId: number, flowId?: string, stepId?: string): Promise<void> {
  try {
    const response = await fetch(`${BACKEND_API_URL}/api/admin/bot/flows/user-states`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tgId,
        currentFlowId: flowId,
        currentStepId: stepId,
        updatedAt: new Date().toISOString(),
      }),
    })
    
    if (!response.ok) {
      console.error('[FLOW ENGINE] Failed to update user state:', response.statusText)
    }
  } catch (error) {
    console.error('[FLOW ENGINE] Error updating user state:', error)
  }
}

/**
 * Инвалидировать кеш flows
 */
export function invalidateCache(): void {
  flowsCache = null
  cacheTimestamp = 0
}

