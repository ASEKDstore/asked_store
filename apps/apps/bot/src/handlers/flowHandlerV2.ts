/**
 * Flow Handler V2
 * Uses new FlowEngine with Prisma and versioning
 */

import { Context } from 'telegraf'
import {
  parseEntryPoint,
  findFlowByEntryPoint,
  startFlow,
  processEvent,
  getUserState,
  getNodeById,
} from '../flowEngineV2.js'
import { renderNode, executeEditAnimation, scheduleDelete } from '../flowRenderer.js'

/**
 * Handle /start command with new FlowEngine
 */
export async function handleStartV2(ctx: Context) {
  try {
    const user = ctx.from
    if (!user) {
      return ctx.reply('Ошибка: не удалось получить данные пользователя')
    }

    // Parse entry point
    const entryPoint = parseEntryPoint(ctx)
    if (!entryPoint) {
      return ctx.reply('Ошибка: не удалось определить точку входа')
    }

    // Find flow by entry point
    const flow = await findFlowByEntryPoint(entryPoint)
    if (!flow) {
      // Fallback to default welcome
      const { config } = await import('../config.js')
      const webappUrl = config.webappUrl

      if (webappUrl) {
        await ctx.reply(
          'Добро пожаловать в ASKED Store! 👋\n\nНажмите кнопку ниже, чтобы открыть магазин:',
          {
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: '🛍 ASKED Store',
                    web_app: { url: webappUrl },
                  },
                ],
              ],
            },
          }
        )
      } else {
        await ctx.reply('Добро пожаловать! Используйте /help для справки.')
      }
      return
    }

    // Get flow version from flow snapshot or database
    let version = 1
    try {
      const { prisma } = await import('../flowEngineV2.js')
      const flowRecord = await prisma.botFlow.findUnique({
        where: { id: flow.flow.id },
      })
      version = flowRecord?.version || 1
    } catch (error) {
      console.warn('[FLOW HANDLER] Could not get flow version:', error)
    }

    // Start flow
    const result = await startFlow(user.id, flow, version)
    if (result.error || !result.node) {
      console.error('[FLOW HANDLER] Start flow error:', result.error)
      return ctx.reply('Произошла ошибка при запуске сценария.')
    }

    // Render node
    const state = await getUserState(user.id)
    // Get flow ID from state
    const flowId = state?.activeFlowId || ''
    const messageId = await renderNode(ctx, result.node, state?.lastMessageId || null, flowId)

    // Update last message ID
    if (messageId) {
      await (await import('../flowEngineV2.js')).updateUserState(user.id, {
        lastMessageId: messageId,
      })
    }

    // Execute effects
    const effects = result.node.effects as any
    if (effects) {
      // Edit animation
      if (effects.editMessageAnimation && messageId) {
        await executeEditAnimation(ctx, messageId, effects.editMessageAnimation)
      }

      // Auto-delete
      if (effects.deleteAfterMs && messageId) {
        scheduleDelete(ctx.chat!.id, messageId, effects.deleteAfterMs)
      }
    }
  } catch (error) {
    console.error('❌ Error in handleStartV2:', error)
    await ctx.reply('Произошла ошибка. Попробуйте позже.')
  }
}

/**
 * Handle callback query for flow buttons
 */
export async function handleFlowCallbackV2(ctx: Context) {
  try {
    const user = ctx.from
    if (!user) {
      return ctx.answerCbQuery('Ошибка: нет данных пользователя')
    }

    const callbackData = (ctx.callbackQuery as any)?.data
    if (!callbackData || typeof callbackData !== 'string') {
      return ctx.answerCbQuery('Ошибка: нет данных')
    }

    // Parse button ID from callback_data
    // Format: flow:flowId:node:nodeId:btn:buttonId
    const parts = callbackData.split(':')
    if (parts.length < 6 || parts[0] !== 'flow' || parts[2] !== 'node' || parts[4] !== 'btn') {
      return ctx.answerCbQuery('Ошибка: неверный формат')
    }

    const buttonId = parts[5]

    // Process event
    const result = await processEvent(user.id, {
      type: 'button',
      data: { buttonId },
    })

    if (result.error || !result.node) {
      console.error('[FLOW HANDLER] Process event error:', result.error)
      return ctx.answerCbQuery('Ошибка при обработке')
    }

    // Render node
    const state = await getUserState(user.id)
    // Get flow ID from state
    const flowId = state?.activeFlowId || ''
    const messageId = await renderNode(ctx, result.node, state?.lastMessageId || null, flowId)

    // Update last message ID
    if (messageId) {
      await (await import('../flowEngineV2.js')).updateUserState(user.id, {
        lastMessageId: messageId,
      })
    }

    // Execute effects
    const effects = result.node.effects as any
    if (effects) {
      // Edit animation
      if (effects.editMessageAnimation && messageId) {
        await executeEditAnimation(ctx, messageId, effects.editMessageAnimation)
      }

      // Auto-delete
      if (effects.deleteAfterMs && messageId) {
        scheduleDelete(ctx.chat!.id, messageId, effects.deleteAfterMs)
      }
    }

    await ctx.answerCbQuery()
  } catch (error) {
    console.error('❌ Error in handleFlowCallbackV2:', error)
    await ctx.answerCbQuery('Произошла ошибка')
  }
}

/**
 * Handle text message for flow input
 */
export async function handleFlowTextV2(ctx: Context) {
  try {
    const user = ctx.from
    if (!user) {
      return
    }

    const text = (ctx.message as any)?.text
    if (!text) {
      return
    }

    // Process event
    const result = await processEvent(user.id, {
      type: 'text',
      data: { text },
    })

    if (result.error || !result.node) {
      // No flow active or no transition
      return
    }

    // Render node
    const state = await getUserState(user.id)
    // Get flow ID from state
    const flowId = state?.activeFlowId || ''
    const messageId = await renderNode(ctx, result.node, state?.lastMessageId || null, flowId)

    // Update last message ID
    if (messageId) {
      await (await import('../flowEngineV2.js')).updateUserState(user.id, {
        lastMessageId: messageId,
      })
    }

    // Execute effects
    const effects = result.node.effects as any
    if (effects) {
      // Edit animation
      if (effects.editMessageAnimation && messageId) {
        await executeEditAnimation(ctx, messageId, effects.editMessageAnimation)
      }

      // Auto-delete
      if (effects.deleteAfterMs && messageId) {
        scheduleDelete(ctx.chat!.id, messageId, effects.deleteAfterMs)
      }
    }
  } catch (error) {
    console.error('❌ Error in handleFlowTextV2:', error)
  }
}

