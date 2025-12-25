import { z } from 'zod'

/**
 * Zod schemas for validation
 */

export const TelegramAuthRequestSchema = z.object({
  initData: z.string().min(1, 'initData is required'),
})

export type TelegramAuthRequest = z.infer<typeof TelegramAuthRequestSchema>
