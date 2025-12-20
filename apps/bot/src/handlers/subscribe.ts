/**
 * Subscribe/Unsubscribe handlers
 */

import { Context } from 'telegraf'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Add or update subscriber
 */
export async function addSubscriber(tgId: number, isActive: boolean): Promise<boolean> {
  try {
    await prisma.telegramSubscriber.upsert({
      where: { tgId: BigInt(tgId) },
      create: {
        tgId: BigInt(tgId),
        isActive,
      },
      update: {
        isActive,
      },
    })
    return true
  } catch (error) {
    console.error('[SUBSCRIBE] Error adding subscriber:', error)
    return false
  }
}

/**
 * Handle /stop command
 */
export async function handleStop(ctx: Context) {
  try {
    const user = ctx.from
    if (!user) {
      return ctx.reply('Ошибка: не удалось получить данные пользователя')
    }

    const success = await addSubscriber(user.id, false)
    
    if (success) {
      await ctx.reply('Вы отписались от новостей ASKED Store.')
    } else {
      await ctx.reply('❌ Произошла ошибка при отписке. Попробуйте позже.')
    }
  } catch (error) {
    console.error('❌ Error in handleStop:', error)
    await ctx.reply('Произошла ошибка. Попробуйте позже.')
  }
}

/**
 * Handle SUBSCRIBE_NEWS action
 */
export async function handleSubscribeNews(ctx: Context) {
  try {
    await ctx.answerCbQuery('✅ Подписка активирована!')
    
    const user = ctx.from
    if (!user) return

    const success = await addSubscriber(user.id, true)
    
    if (success) {
      await ctx.reply('✅ Вы подписаны на новости ASKED Store!\n\nВы будете получать уведомления о дропах, новинках и акциях.')
    } else {
      await ctx.reply('❌ Произошла ошибка при подписке. Попробуйте позже.')
    }
  } catch (error) {
    console.error('❌ Error in handleSubscribeNews:', error)
    await ctx.answerCbQuery('❌ Ошибка при подписке')
  }
}

/**
 * Handle UNSUBSCRIBE_NEWS action
 */
export async function handleUnsubscribeNews(ctx: Context) {
  try {
    await ctx.answerCbQuery('Вы отписались')
    await handleStop(ctx)
  } catch (error) {
    console.error('❌ Error in handleUnsubscribeNews:', error)
  }
}
