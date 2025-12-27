// Channel queue worker - processes queued channel messages

import { prisma } from '../prisma.js'
import { botConfigClient } from '../config/client.js'
import type { ChannelQueuePayloadDTO } from '@asked-store/shared'

const POLL_INTERVAL_MS = parseInt(process.env.CHANNEL_QUEUE_POLL_INTERVAL_MS || '15000', 10) // Default: 15 seconds
const MAX_ATTEMPTS = 5

interface TelegramMessageResponse {
  message_id: number
  chat: {
    id: number
    type: string
  }
  text?: string
  date: number
}

class ChannelQueueWorker {
  private isRunning = false
  private pollTimer: NodeJS.Timeout | null = null
  private telegramBot: any = null // Telegraf bot instance

  /**
   * Initialize worker with Telegram bot instance
   */
  initialize(telegramBot: any): void {
    this.telegramBot = telegramBot
  }

  /**
   * Start the worker
   */
  start(): void {
    if (this.isRunning) {
      console.warn('⚠️ Channel queue worker is already running')
      return
    }

    this.isRunning = true
    console.log(`🚀 Starting channel queue worker (poll interval: ${POLL_INTERVAL_MS}ms)`)
    
    // Start polling immediately, then continue on interval
    this.processQueue()
    
    this.pollTimer = setInterval(() => {
      this.processQueue()
    }, POLL_INTERVAL_MS)
  }

  /**
   * Stop the worker
   */
  stop(): void {
    if (!this.isRunning) {
      return
    }

    this.isRunning = false
    if (this.pollTimer) {
      clearInterval(this.pollTimer)
      this.pollTimer = null
    }
    console.log('🛑 Channel queue worker stopped')
  }

  /**
   * Process queued items
   */
  private async processQueue(): Promise<void> {
    try {
      // Get channel config to get channel ID
      const channelConfig = botConfigClient.getChannelConfigOrThrow()
      const channelId = channelConfig.channelId

      // Find queued items that are ready to send (scheduledAt <= now or null)
      const now = new Date()
      const queuedItems = await prisma.channelQueue.findMany({
        where: {
          status: 'queued',
          OR: [
            { scheduledAt: null },
            { scheduledAt: { lte: now } },
          ],
        },
        orderBy: {
          scheduledAt: 'asc',
        },
        take: 10, // Process up to 10 items per poll
      })

      if (queuedItems.length === 0) {
        return // No items to process
      }

      console.log(`📬 Processing ${queuedItems.length} channel queue items...`)

      for (const item of queuedItems) {
        await this.processQueueItem(item.id, channelId, item.payload as ChannelQueuePayloadDTO)
      }
    } catch (error) {
      console.error('❌ Error processing channel queue:', error)
    }
  }

  /**
   * Process a single queue item
   */
  private async processQueueItem(
    queueItemId: string,
    channelId: string,
    payload: ChannelQueuePayloadDTO
  ): Promise<void> {
    try {
      // Increment attempts
      const queueItem = await prisma.channelQueue.findUnique({
        where: { id: queueItemId },
      })

      if (!queueItem || queueItem.status !== 'queued') {
        return // Item was cancelled or already processed
      }

      const newAttempts = queueItem.attempts + 1

      // Prepare message content
      let messageText = ''
      if (payload.content) {
        messageText = payload.content
      } else if (payload.templateKey) {
        // Get template from channel config
        const channelConfig = botConfigClient.getChannelConfigOrThrow()
        // templateKey should match template id
        const template = channelConfig.postTemplates.find((t) => t.id === payload.templateKey)
        
        if (!template) {
          throw new Error(`Template with id "${payload.templateKey}" not found in channel config`)
        }

        messageText = template.content

        // Replace variables in template
        if (payload.variables) {
          for (const [key, value] of Object.entries(payload.variables)) {
            messageText = messageText.replace(new RegExp(`{{${key}}}`, 'g'), String(value))
          }
        }
      } else {
        throw new Error('Either content or templateKey must be provided in payload')
      }

      // Prepare inline keyboard buttons if provided
      let replyMarkup: any = undefined
      if (payload.buttons && payload.buttons.length > 0) {
        replyMarkup = {
          inline_keyboard: payload.buttons.map((btn) => [
            {
              text: btn.text,
              ...(btn.url && { url: btn.url }),
              ...(btn.webAppUrl && { web_app: { url: btn.webAppUrl } }),
              ...(btn.callbackData && { callback_data: btn.callbackData }),
            },
          ]),
        }
      }

      // Send message to channel
      if (!this.telegramBot) {
        throw new Error('Telegram bot not initialized')
      }

      const message: TelegramMessageResponse = await this.telegramBot.telegram.sendMessage(
        channelId,
        messageText,
        {
          parse_mode: 'HTML',
          reply_markup: replyMarkup,
        }
      )

      // Update queue item as sent
      await prisma.channelQueue.update({
        where: { id: queueItemId },
        data: {
          status: 'sent',
          sentAt: new Date(),
          messageId: message.message_id,
          attempts: newAttempts,
          lastError: null,
        },
      })

      console.log(`✅ Sent channel message (queueId: ${queueItemId}, messageId: ${message.message_id})`)
    } catch (error: any) {
      console.error(`❌ Error processing queue item ${queueItemId}:`, error)

      // Update queue item with error
      const queueItem = await prisma.channelQueue.findUnique({
        where: { id: queueItemId },
      })

      if (!queueItem) {
        return
      }

      const newAttempts = queueItem.attempts + 1
      const errorMessage = error.message || String(error)

      if (newAttempts >= MAX_ATTEMPTS) {
        // Mark as failed after max attempts
        await prisma.channelQueue.update({
          where: { id: queueItemId },
          data: {
            status: 'failed',
            attempts: newAttempts,
            lastError: errorMessage,
          },
        })
        console.log(`❌ Queue item ${queueItemId} failed after ${MAX_ATTEMPTS} attempts`)
      } else {
        // Update attempts but keep as queued for retry
        await prisma.channelQueue.update({
          where: { id: queueItemId },
          data: {
            attempts: newAttempts,
            lastError: errorMessage,
          },
        })
        console.log(`⚠️ Queue item ${queueItemId} failed (attempt ${newAttempts}/${MAX_ATTEMPTS}), will retry`)
      }
    }
  }
}

// Singleton instance
export const channelQueueWorker = new ChannelQueueWorker()

