// Zod schemas for validation

import { z } from 'zod'
import { SettingsScope } from './types'

export const telegramAuthRequestSchema = z.object({
  initData: z.string().min(1, 'initData is required'),
})

export type TelegramAuthRequest = z.infer<typeof telegramAuthRequestSchema>

// --- Config DTO Schemas ---

export const menuButtonSchema = z.object({
  text: z.string().min(1),
  url: z.string().url().optional(),
  webAppUrl: z.string().url().optional(),
  callbackData: z.string().optional(),
}).partial({ url: true, webAppUrl: true, callbackData: true }) // Allow partial for flexibility, but ensure at least one is present if needed

export const deepLinkSchema = z.object({
  key: z.string().min(1),
  url: z.string().url(),
  description: z.string().optional(),
})

export const botConfigSchema = z.object({
  webappUrl: z.string().url(),
  backendUrl: z.string().url(),
  menuButtons: z.array(menuButtonSchema),
  deepLinks: z.array(deepLinkSchema),
})

export const postTemplateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  content: z.string().min(1),
  buttons: z.array(menuButtonSchema).optional(),
})

export const scheduleRuleSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  cron: z.string().min(1), // TODO: Add more specific cron validation
  templateId: z.string().uuid(),
  enabled: z.boolean(),
})

export const channelConfigSchema = z.object({
  channelId: z.string().min(1),
  postTemplates: z.array(postTemplateSchema),
  defaultButtons: z.array(menuButtonSchema),
  timezone: z.string().min(1), // TODO: Add IANA timezone validation
  scheduleRules: z.array(scheduleRuleSchema),
})

export const uiFlagsSchema = z.record(z.string(), z.unknown()).partial() // Flexible UI flags
export const supportContactSchema = z.record(z.string(), z.unknown()).partial() // Flexible support contacts

export const webAppPublicConfigSchema = z.object({
  shopName: z.string().min(1),
  uiFlags: uiFlagsSchema,
  supportContact: supportContactSchema,
})

export const updateSettingsRequestSchema = z.object({
  value: z.unknown(), // Value can be any JSON
})

export const settingsScopeSchema = z.nativeEnum(SettingsScope)

export const getSettingsQuerySchema = z.object({
  scope: settingsScopeSchema.optional(),
})

// --- Channel Queue Schemas ---

export const menuButtonInputSchema = z.object({
  text: z.string().min(1),
  url: z.string().url().optional(),
  webAppUrl: z.string().url().optional(),
  callbackData: z.string().optional(),
})

export const channelQueuePayloadSchema = z.object({
  templateKey: z.string().optional(),
  variables: z.record(z.string(), z.unknown()).optional(),
  content: z.string().optional(),
  buttons: z.array(menuButtonInputSchema).optional(),
}).refine(
  (data) => data.templateKey || data.content,
  {
    message: 'Either templateKey or content must be provided',
  }
)

export const createChannelQueueRequestSchema = z.object({
  templateKey: z.string().optional(),
  variables: z.record(z.string(), z.unknown()).optional(),
  content: z.string().optional(),
  buttons: z.array(menuButtonInputSchema).optional(),
  scheduledAt: z.string().datetime().optional().nullable(), // ISO 8601 date string
}).refine(
  (data) => data.templateKey || data.content,
  {
    message: 'Either templateKey or content must be provided',
  }
)

