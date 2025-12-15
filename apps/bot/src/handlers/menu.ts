import { Context } from 'telegraf'

/**
 * Menu action callbacks
 */
export enum MenuActions {
  OPEN_APP = 'OPEN_APP',
  MY_ORDERS = 'MY_ORDERS',
  ASKED_LAB = 'ASKED_LAB',
}

/**
 * Handle MY_ORDERS action
 */
export async function handleMyOrders(ctx: Context) {
  try {
    await ctx.answerCbQuery()
    await ctx.reply(
      'Здесь в будущем будут отображаться твои заказы 🧾\nПока этот раздел в разработке.'
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
      'Здесь будет управление кастомами и проектами ASKED LAB 🎨\nСкоро подключим.'
    )
  } catch (error) {
    console.error('❌ Error in handleAskedLab:', error)
  }
}

/**
 * Handle OPEN_APP action
 */
export async function handleOpenApp(ctx: Context) {
  try {
    await ctx.answerCbQuery()
    await ctx.reply(
      'Веб-приложение скоро будет доступно. Следи за обновлениями 👀'
    )
  } catch (error) {
    console.error('❌ Error in handleOpenApp:', error)
  }
}





