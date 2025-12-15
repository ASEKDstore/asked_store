/**
 * Status messages templates
 * 
 * NOTE: These are placeholders. All bot messages should be managed
 * through BotFlows API in the admin panel.
 * 
 * This file is kept for backward compatibility but should not be used
 * for new messages. Use BotFlows instead.
 */

import { sendWithEmoji } from './sendWithCustomEmoji.js'

type TelegramApi = {
  sendMessage?: (chatId: number | string, text: string, options?: any) => Promise<any>
  telegram?: {
    sendMessage?: (chatId: number | string, text: string, options?: any) => Promise<any>
  }
}

export const status = {
  /**
   * Placeholder - use BotFlows instead
   */
  async appStarting(api: TelegramApi, chatId: number | string): Promise<void> {
    // Deprecated - use BotFlows API
    console.warn('status.appStarting is deprecated, use BotFlows API instead')
  },

  /**
   * Placeholder - use BotFlows instead
   */
  async labStarting(api: TelegramApi, chatId: number | string): Promise<void> {
    // Deprecated - use BotFlows API
    console.warn('status.labStarting is deprecated, use BotFlows API instead')
  },

  /**
   * Placeholder - use BotFlows instead
   */
  async checkPayment(api: TelegramApi, chatId: number | string): Promise<void> {
    // Deprecated - use BotFlows API
    console.warn('status.checkPayment is deprecated, use BotFlows API instead')
  },

  /**
   * Placeholder - use BotFlows instead
   */
  async paymentOk(api: TelegramApi, chatId: number | string): Promise<void> {
    // Deprecated - use BotFlows API
    console.warn('status.paymentOk is deprecated, use BotFlows API instead')
  },
}
