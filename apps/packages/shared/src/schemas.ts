// Zod schemas for validation

import { z } from 'zod'

export const telegramAuthRequestSchema = z.object({
  initData: z.string().min(1, 'initData is required'),
})

export type TelegramAuthRequest = z.infer<typeof telegramAuthRequestSchema>

