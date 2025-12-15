/**
 * Шаблоны статусных сообщений с кастомными эмодзи
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
   * Приложение запускается
   */
  async appStarting(api: TelegramApi, chatId: number | string): Promise<void> {
    await sendWithEmoji(api, chatId, 'Приложение запускается {gear}')
  },

  /**
   * Запускаю ASKED LAB
   */
  async labStarting(api: TelegramApi, chatId: number | string): Promise<void> {
    await sendWithEmoji(api, chatId, 'Запускаю ASKED LAB {green}')
  },

  /**
   * Проверяем статус оплаты
   */
  async checkPayment(api: TelegramApi, chatId: number | string): Promise<void> {
    await sendWithEmoji(
      api,
      chatId,
      'Проверяем статус оплаты, обычно это занимает не более 5 минут {dots}'
    )
  },

  /**
   * Оплата принята
   */
  async paymentOk(api: TelegramApi, chatId: number | string): Promise<void> {
    await sendWithEmoji(
      api,
      chatId,
      'Оплата принята! {ok}\nСпасибо за покупку {heart}'
    )
  },
}




