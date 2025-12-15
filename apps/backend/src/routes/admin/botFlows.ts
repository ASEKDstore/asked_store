import { Router, Request, Response, NextFunction } from 'express'
import { readJson, writeJson } from '../../store/jsonDb.js'
import type { BotFlow, BotStep, BotButton, BotUserState } from '../../types/botFlow.js'
import { randomUUID } from 'crypto'

const router = Router()
const FLOWS_KEY = 'botFlows'
const USER_STATES_KEY = 'botUserStates'

// GET /api/admin/bot/flows
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const flows = await readJson<BotFlow[]>(FLOWS_KEY, [])
    // Возвращаем только метаданные для списка
    const list = flows.map(f => ({
      id: f.id,
      name: f.name,
      trigger: f.trigger,
      enabled: f.enabled,
      updatedAt: f.updatedAt,
    }))
    res.json(list)
  } catch (error: any) {
    console.error('[BOT FLOWS] Error fetching list:', error)
    next(error)
  }
})

// GET /api/admin/bot/flows/:id
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const flows = await readJson<BotFlow[]>(FLOWS_KEY, [])
    const flow = flows.find(f => f.id === req.params.id)
    
    if (!flow) {
      return res.status(404).json({ message: 'Flow not found' })
    }
    
    res.json(flow)
  } catch (error: any) {
    console.error('[BOT FLOWS] Error fetching flow:', error)
    next(error)
  }
})

// Валидация flow
function validateFlow(flow: Partial<BotFlow>): { valid: boolean; error?: string } {
  if (!flow.name || !flow.name.trim()) {
    return { valid: false, error: 'name is required' }
  }
  
  if (!flow.trigger || !['start', 'menu', 'help', 'custom'].includes(flow.trigger)) {
    return { valid: false, error: 'trigger must be one of: start, menu, help, custom' }
  }
  
  if (!flow.steps || !Array.isArray(flow.steps) || flow.steps.length === 0) {
    return { valid: false, error: 'steps array is required and must not be empty' }
  }
  
  if (!flow.startStepId) {
    return { valid: false, error: 'startStepId is required' }
  }
  
  // Проверяем, что startStepId существует в steps
  const stepIds = flow.steps.map(s => s.id)
  if (!stepIds.includes(flow.startStepId)) {
    return { valid: false, error: `startStepId "${flow.startStepId}" not found in steps` }
  }
  
  // Валидация каждого шага
  for (const step of flow.steps) {
    if (!step.id || !step.name) {
      return { valid: false, error: 'Each step must have id and name' }
    }
    
    // Валидация content
    if (step.content.type === 'message') {
      if (!step.content.text || !step.content.text.trim()) {
        return { valid: false, error: `Step "${step.name}": message text is required` }
      }
    } else if (step.content.type === 'photo') {
      if (!step.content.imageUrl || !step.content.imageUrl.trim()) {
        return { valid: false, error: `Step "${step.name}": photo imageUrl is required` }
      }
    } else {
      return { valid: false, error: `Step "${step.name}": invalid content type` }
    }
    
    // Валидация кнопок
    if (step.buttons) {
      for (const button of step.buttons) {
        if (!button.id || !button.text || !button.kind) {
          return { valid: false, error: `Step "${step.name}": button must have id, text, and kind` }
        }
        
        if (button.kind === 'next') {
          if (!button.nextStepId) {
            return { valid: false, error: `Step "${step.name}": button "${button.text}" requires nextStepId` }
          }
          if (!stepIds.includes(button.nextStepId)) {
            return { valid: false, error: `Step "${step.name}": button "${button.text}" nextStepId "${button.nextStepId}" not found in steps` }
          }
        } else if (button.kind === 'url') {
          if (!button.url || !button.url.trim()) {
            return { valid: false, error: `Step "${step.name}": button "${button.text}" requires url` }
          }
        }
      }
    }
  }
  
  return { valid: true }
}

// POST /api/admin/bot/flows
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const flowData: Partial<BotFlow> = req.body
    
    // Генерируем ID если нет
    if (!flowData.id) {
      flowData.id = randomUUID()
    }
    
    // Устанавливаем updatedAt
    flowData.updatedAt = new Date().toISOString()
    
    // Валидация
    const validation = validateFlow(flowData)
    if (!validation.valid) {
      return res.status(400).json({ message: validation.error })
    }
    
    const flows = await readJson<BotFlow[]>(FLOWS_KEY, [])
    
    // Проверяем, что ID уникален
    if (flows.some(f => f.id === flowData.id)) {
      return res.status(400).json({ message: `Flow with id "${flowData.id}" already exists` })
    }
    
    flows.push(flowData as BotFlow)
    await writeJson(FLOWS_KEY, flows)
    
    console.log('[BOT FLOWS] Created flow:', flowData.id, flowData.name)
    res.status(201).json(flowData)
  } catch (error: any) {
    console.error('[BOT FLOWS] Error creating flow:', error)
    next(error)
  }
})

// PUT /api/admin/bot/flows/:id
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const flowId = req.params.id
    const flowData: Partial<BotFlow> = req.body
    
    const flows = await readJson<BotFlow[]>(FLOWS_KEY, [])
    const index = flows.findIndex(f => f.id === flowId)
    
    if (index === -1) {
      return res.status(404).json({ message: 'Flow not found' })
    }
    
    // Сохраняем ID и обновляем updatedAt
    flowData.id = flowId
    flowData.updatedAt = new Date().toISOString()
    
    // Валидация
    const validation = validateFlow(flowData)
    if (!validation.valid) {
      return res.status(400).json({ message: validation.error })
    }
    
    flows[index] = flowData as BotFlow
    await writeJson(FLOWS_KEY, flows)
    
    console.log('[BOT FLOWS] Updated flow:', flowId, flowData.name)
    res.json(flowData)
  } catch (error: any) {
    console.error('[BOT FLOWS] Error updating flow:', error)
    next(error)
  }
})

// DELETE /api/admin/bot/flows/:id
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const flowId = req.params.id
    const flows = await readJson<BotFlow[]>(FLOWS_KEY, [])
    const index = flows.findIndex(f => f.id === flowId)
    
    if (index === -1) {
      return res.status(404).json({ message: 'Flow not found' })
    }
    
    flows.splice(index, 1)
    await writeJson(FLOWS_KEY, flows)
    
    console.log('[BOT FLOWS] Deleted flow:', flowId)
    res.json({ ok: true })
  } catch (error: any) {
    console.error('[BOT FLOWS] Error deleting flow:', error)
    next(error)
  }
})

// POST /api/admin/bot/flows/:id/test
router.post('/:id/test', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const flowId = req.params.id
    const { stepId, tgId } = req.body
    
    const flows = await readJson<BotFlow[]>(FLOWS_KEY, [])
    const flow = flows.find(f => f.id === flowId)
    
    if (!flow) {
      return res.status(404).json({ message: 'Flow not found' })
    }
    
    if (!flow.enabled) {
      return res.status(400).json({ message: 'Flow is disabled' })
    }
    
    // Получаем tgId из админа (из requireAdmin middleware или body)
    const adminTgId = tgId || (req as any).adminTgId
    if (!adminTgId) {
      return res.status(400).json({ message: 'tgId is required for test' })
    }
    
    const targetStepId = stepId || flow.startStepId
    const step = flow.steps.find(s => s.id === targetStepId)
    
    if (!step) {
      return res.status(400).json({ message: `Step "${targetStepId}" not found` })
    }
    
    // Отправляем тест через Telegram API
    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
    if (!BOT_TOKEN) {
      return res.status(500).json({ message: 'TELEGRAM_BOT_TOKEN not configured' })
    }
    
    // Отправляем тестовое сообщение админу
    try {
      const TELEGRAM_API_URL = 'https://api.telegram.org/bot'
      
      // Формируем inline keyboard если есть кнопки
      let replyMarkup: any = undefined
      if (step.buttons && step.buttons.length > 0) {
        const rows: any[][] = []
        for (let i = 0; i < step.buttons.length; i += 2) {
          const row = step.buttons.slice(i, i + 2).map(btn => {
            if (btn.kind === 'url') {
              return { text: btn.text, url: btn.url }
            } else {
              return { text: btn.text, callback_data: `flow:${flowId}:step:${step.id}:btn:${btn.id}` }
            }
          })
          rows.push(row)
        }
        replyMarkup = { inline_keyboard: rows }
      }
      
      if (step.content.type === 'message') {
        const payload: any = {
          chat_id: adminTgId,
          text: step.content.text,
          reply_markup: replyMarkup,
        }
        
        if (step.content.parseMode && !step.content.entitiesJson) {
          payload.parse_mode = step.content.parseMode
        }
        
        if (step.content.entitiesJson) {
          payload.entities = step.content.entitiesJson
        }
        
        const response = await fetch(`${TELEGRAM_API_URL}${BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        
        const result = await response.json()
        if (!response.ok || !result.ok) {
          return res.status(400).json({ message: `Telegram API error: ${result.description || 'Unknown error'}` })
        }
      } else if (step.content.type === 'photo') {
        const payload: any = {
          chat_id: adminTgId,
          photo: step.content.imageUrl,
          caption: step.content.caption || '',
          reply_markup: replyMarkup,
        }
        
        // Важно: если есть entitiesJson → НЕ отправляем parse_mode
        if (step.content.entitiesJson) {
          payload.caption_entities = step.content.entitiesJson
        } else if (step.content.parseMode) {
          payload.parse_mode = step.content.parseMode
        }
        
        const response = await fetch(`${TELEGRAM_API_URL}${BOT_TOKEN}/sendPhoto`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        
        const result = await response.json()
        if (!response.ok || !result.ok) {
          return res.status(400).json({ message: `Telegram API error: ${result.description || 'Unknown error'}` })
        }
      }
      
      console.log('[BOT FLOWS] Test sent:', { flowId, stepId: targetStepId, tgId: adminTgId })
      
      res.json({ 
        ok: true, 
        message: 'Test message sent successfully',
        stepId: targetStepId,
        tgId: adminTgId,
      })
    } catch (error: any) {
      console.error('[BOT FLOWS] Error sending test:', error)
      return res.status(500).json({ message: `Failed to send test: ${error.message}` })
    }
  } catch (error: any) {
    console.error('[BOT FLOWS] Error testing flow:', error)
    next(error)
  }
})

// GET /api/admin/bot/flows/user-states
router.get('/user-states', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const states = await readJson<any[]>(USER_STATES_KEY, [])
    res.json(states)
  } catch (error: any) {
    console.error('[BOT FLOWS] Error fetching user states:', error)
    next(error)
  }
})

export default router

