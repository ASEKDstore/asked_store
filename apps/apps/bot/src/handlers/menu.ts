import { Context } from 'telegraf'
import { addSubscriber, handleStop } from './subscribe.js'

/**
 * Menu action callbacks
 */
export enum MenuActions {
  OPEN_APP = 'OPEN_APP',
  MY_ORDERS = 'MY_ORDERS',
  ASKED_LAB = 'ASKED_LAB',
  SUBSCRIBE_NEWS = 'SUBSCRIBE_NEWS',
  UNSUBSCRIBE_NEWS = 'UNSUBSCRIBE_NEWS',
}

/**
 * Handle MY_ORDERS action
 */
export async function handleMyOrders(ctx: Context) {
  try {
    await ctx.answerCbQuery()
    await ctx.reply(
      'Здесь в будущем будут отображаться твои заказы 📦\nПока этот раздел в разработке.'    
    )
  } catch (error) {
    console.error('❌ Error in handleMyOrders:', error)
  }
}

/**
 * Handle ASKED_LAB action
 */
export async function handleAskedLab(ctx: Context) {
  try {
    await ctx.answerCbQuery()
    await ctx.reply(
      'Здесь будет управление кастомами и проектами ASKED LAB 🧪\nСкоро подключим.'                      
    )
  } catch (error) {
    console.error('❌ Error in handleAskedLab:', error)
  }
}

/**
 * Handle OPEN_APP action
 * Sends web_app button to open Mini App
 */
export async function handleOpenApp(ctx: Context) {
  try {
    await ctx.answerCbQuery()
    
    const { config } = await import('../config.js')
    const webappUrl = config.webappUrl

    if (!webappUrl) {
      await ctx.reply(
        '❌ Веб-приложение не настроено. Обратитесь к администратору.'
      )
      return
    }

    // Send message with web_app button
    await ctx.reply(
      'Открываю магазин... 🛍',
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
  } catch (error) {
    console.error('❌ Error in handleOpenApp:', error)
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



