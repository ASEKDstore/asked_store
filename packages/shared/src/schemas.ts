// Zod schemas for validation
// Version: 1.1.0

import { z } from 'zod'

export const telegramAuthRequestSchema = z.object({
  initData: z.string().min(1, 'initData is required'),
})

export type TelegramAuthRequest = z.infer<typeof telegramAuthRequestSchema>

// Menu Button Schema
export const menuButtonSchema = z.object({
  text: z.string().min(1),
  url: z.string().url().optional(),
  webAppUrl: z.string().url().optional(),
  callbackData: z.string().optional(),
})

// Deep Link Schema
export const deepLinkSchema = z.object({
  key: z.string().min(1),
  url: z.string().url(),
  description: z.string().optional(),
})

// Bot Config Schema
export const botConfigSchema = z.object({
  webappUrl: z.string().url(),
  backendUrl: z.string().url(),
  menuButtons: z.array(menuButtonSchema),
  deepLinks: z.array(deepLinkSchema),
})

// Post Template Schema
export const postTemplateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  content: z.string(),
  buttons: z.array(menuButtonSchema).optional(),
})

// Schedule Rule Schema
export const scheduleRuleSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  cron: z.string(), // Cron expression validation could be enhanced
  templateId: z.string().uuid(),
  enabled: z.boolean(),
})

// Channel Config Schema
export const channelConfigSchema = z.object({
  channelId: z.string().min(1),
  postTemplates: z.array(postTemplateSchema),
  defaultButtons: z.array(menuButtonSchema),
  timezone: z.string(), // IANA timezone validation could be enhanced
  scheduleRules: z.array(scheduleRuleSchema),
})

// UI Flags Schema
export const uiFlagsSchema = z.object({
  enableCatalog: z.boolean().optional(),
  enableCart: z.boolean().optional(),
  enableOrders: z.boolean().optional(),
  enableProfile: z.boolean().optional(),
}).passthrough() // Allow additional flags

// Support Contact Schema
export const supportContactSchema = z.object({
  telegram: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
}).passthrough() // Allow additional contact methods

// WebApp Public Config Schema
export const webAppPublicConfigSchema = z.object({
  shopName: z.string().min(1),
  uiFlags: uiFlagsSchema,
  supportContact: supportContactSchema,
})

// Export types
export type MenuButton = z.infer<typeof menuButtonSchema>
export type DeepLink = z.infer<typeof deepLinkSchema>
export type BotConfig = z.infer<typeof botConfigSchema>
export type PostTemplate = z.infer<typeof postTemplateSchema>
export type ScheduleRule = z.infer<typeof scheduleRuleSchema>
export type ChannelConfig = z.infer<typeof channelConfigSchema>
export type UIFlags = z.infer<typeof uiFlagsSchema>
export type SupportContact = z.infer<typeof supportContactSchema>
export type WebAppPublicConfig = z.infer<typeof webAppPublicConfigSchema>

