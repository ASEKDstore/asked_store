import { Context } from 'telegraf'
import { getFlowByTrigger, getFlowById, getStepFromFlow, updateUserState } from '../flowEngine.js'
import { sendStep, parseCallbackData } from '../flowSender.js'
// Локальные типы
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

/**
 * Обработчик /start с поддержкой flows
 */
export async function handleStartWithFlow(ctx: Context) {
  try {
    const user = ctx.from
    if (!user) {
      return ctx.reply('Ошибка: не удалось получить данные пользователя')
    }

    // Ищем enabled flow с trigger="start"
    const flow = await getFlowByTrigger('start')
    
    if (flow) {
      // Выполняем flow
      const step = getStepFromFlow(flow, flow.startStepId)
      if (step) {
        // Обновляем состояние пользователя
        await updateUserState(user.id, flow.id, step.id)
        
        // Отправляем шаг
        const success = await sendStep(ctx.chat.id, step, flow.id)
        if (success) {
          return // Flow выполнен
        }
      }
    }
    
    // Fallback: старый обработчик /start
    // (можно оставить или убрать)
    await ctx.reply('Добро пожаловать! Используйте /help для справки.')
  } catch (error) {
    console.error('❌ Error in handleStartWithFlow:', error)
    await ctx.reply('Произошла ошибка. Попробуйте позже.')
  }
}

/**
 * Обработчик callback_query для flow кнопок
 */
export async function handleFlowCallback(ctx: Context) {
  try {
    const callbackData = (ctx.callbackQuery as any)?.data
    if (!callbackData) {
      return ctx.answerCbQuery('Ошибка: нет данных')
    }

    // Парсим callback_data
    const parsed = parseCallbackData(callbackData)
    if (!parsed) {
      return ctx.answerCbQuery('Ошибка: неверный формат')
    }

    const { flowId, stepId, buttonId } = parsed

    // Получаем flow
    const flow = await getFlowById(flowId)
    if (!flow || !flow.enabled) {
      return ctx.answerCbQuery('Сценарий не найден или отключен')
    }

    // Получаем текущий шаг
    const currentStep = getStepFromFlow(flow, stepId)
    if (!currentStep) {
      return ctx.answerCbQuery('Шаг не найден')
    }

    // Находим кнопку
    const button = currentStep.buttons?.find(b => b.id === buttonId)
    if (!button) {
      return ctx.answerCbQuery('Кнопка не найдена')
    }

    const user = ctx.from
    if (!user) {
      return ctx.answerCbQuery('Ошибка: нет данных пользователя')
    }

    // Обрабатываем действие кнопки
    if (button.kind === 'next') {
      // Переход к следующему шагу
      if (!button.nextStepId) {
        return ctx.answerCbQuery('Ошибка: следующий шаг не указан')
      }

      const nextStep = getStepFromFlow(flow, button.nextStepId)
      if (!nextStep) {
        return ctx.answerCbQuery('Следующий шаг не найден')
      }

      // Обновляем состояние
      await updateUserState(user.id, flow.id, nextStep.id)

      // Отправляем следующий шаг
      const success = await sendStep(ctx.chat.id, nextStep, flow.id)
      if (success) {
        await ctx.answerCbQuery()
      } else {
        await ctx.answerCbQuery('Ошибка при отправке сообщения')
      }
    } else if (button.kind === 'url') {
      // URL кнопка - просто отвечаем на callback
      await ctx.answerCbQuery()
    } else if (button.kind === 'action') {
      // Выполняем действие
      await handleButtonAction(ctx, button, flow)
    }
  } catch (error) {
    console.error('❌ Error in handleFlowCallback:', error)
    await ctx.answerCbQuery('Произошла ошибка')
  }
}

/**
 * Обработка действий кнопок
 */
async function handleButtonAction(ctx: Context, button: BotButton, flow: BotFlow) {
  const user = ctx.from
  if (!user) return

  switch (button.action) {
    case 'open_catalog':
      await ctx.answerCbQuery('Открываем каталог...')
      // Можно отправить ссылку или выполнить другой flow
      break
    case 'open_top_games':
      await ctx.answerCbQuery('Открываем топ игр...')
      break
    case 'open_lab':
      await ctx.answerCbQuery('Открываем LAB...')
      break
    case 'noop':
    default:
      await ctx.answerCbQuery()
      break
  }
}

