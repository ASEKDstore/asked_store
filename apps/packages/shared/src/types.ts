// Shared DTOs and types for ASKED Store
// Version: 1.1.0

/**
 * User DTO - represents a user in the system
 */
export interface UserDTO {
  id: string
  tgId: string
  username: string | null
  firstName: string | null
  lastName: string | null
  photoUrl: string | null
  roles: string[] // Array of role names
  createdAt: string // ISO 8601 date string
  updatedAt: string // ISO 8601 date string
}

/**
 * Role DTO - represents a role in the RBAC system
 */
export interface RoleDTO {
  id: string
  name: string
  description: string | null
  createdAt: string // ISO 8601 date string
  updatedAt: string // ISO 8601 date string
}

/**
 * Settings Scope - scope for settings
 */
export type SettingsScope = 'global' | 'bot' | 'channel' | 'webapp'

/**
 * Settings DTO - represents a configuration setting
 */
export interface SettingsDTO {
  id: string
  key: string
  value: unknown // JSON value
  scope: SettingsScope
  updatedBy: string | null
  updatedAt: string // ISO 8601 date string
  createdAt: string // ISO 8601 date string
}

/**
 * Update Settings Request DTO
 */
export interface UpdateSettingsRequestDTO {
  value: unknown // JSON value
}

/**
 * Public Settings DTO - limited settings for public access
 */
export interface PublicSettingsDTO {
  shopName?: unknown
  supportContact?: unknown
  uiFlags?: unknown
}

/**
 * Menu Button DTO - for bot menus or inline keyboards
 */
export interface MenuButtonDTO {
  text: string
  url?: string
  webAppUrl?: string
  callbackData?: string
}

/**
 * Deep Link DTO - for bot deep links
 */
export interface DeepLinkDTO {
  key: string // Unique key for the deep link
  url: string // Full deep link URL
  description?: string
}

/**
 * Bot Config DTO - bot specific configuration settings
 */
export interface BotConfigDTO {
  webappUrl: string
  backendUrl: string
  menuButtons: MenuButtonDTO[]
  deepLinks: DeepLinkDTO[]
}

/**
 * Post Template DTO - for channel posts
 */
export interface PostTemplateDTO {
  id: string
  name: string
  content: string
  buttons?: MenuButtonDTO[]
}

/**
 * Schedule Rule DTO - rule for scheduled posts
 */
export interface ScheduleRuleDTO {
  id: string
  name: string
  cron: string // Cron expression
  templateId: string
  enabled: boolean
}

/**
 * Channel Config DTO - channel configuration settings
 */
export interface ChannelConfigDTO {
  channelId: string
  postTemplates: PostTemplateDTO[]
  defaultButtons: MenuButtonDTO[]
  timezone: string // IANA timezone (e.g., 'Europe/Moscow')
  scheduleRules: ScheduleRuleDTO[]
}

/**
 * UI Flags DTO - UI feature flags
 */
export interface UIFlagsDTO {
  enableCatalog?: boolean
  enableCart?: boolean
  enableOrders?: boolean
  enableProfile?: boolean
  [key: string]: unknown // Allow additional flags
}

/**
 * Support Contact DTO - support contact information
 */
export interface SupportContactDTO {
  telegram?: string
  email?: string
  phone?: string
  [key: string]: unknown // Allow additional contact methods
}

/**
 * WebApp Public Config DTO - public configuration for web app
 */
export interface WebAppPublicConfigDTO {
  shopName: string
  uiFlags: UIFlagsDTO
  supportContact: SupportContactDTO
}

/**
 * Auth Response DTO - response from POST /auth/telegram
 */
export interface AuthResponseDTO {
  token: string // JWT token
  user: UserDTO
}

/**
 * JWT Payload - structure of JWT token payload
 */
export interface JWTPayload {
  sub: string // User ID (userId)
  tgId: string
  roles: string[] // Array of role names
  iat?: number // Issued at timestamp
  exp?: number // Expiration timestamp
}

/**
 * Channel Queue Status
 */
export type ChannelQueueStatus = 'queued' | 'sent' | 'failed'

/**
 * Channel Queue Item DTO
 */
export interface ChannelQueueItemDTO {
  id: string
  payload: ChannelQueuePayloadDTO
  status: ChannelQueueStatus
  scheduledAt: string | null // ISO 8601 date string
  sentAt: string | null // ISO 8601 date string
  messageId: number | null
  attempts: number
  lastError: string | null
  createdAt: string // ISO 8601 date string
  updatedAt: string // ISO 8601 date string
}

/**
 * Channel Queue Payload DTO - content of the message to send
 */
export interface ChannelQueuePayloadDTO {
  templateKey?: string // Template key from channel config
  variables?: Record<string, unknown> // Variables to replace in template
  content?: string // Direct content (if no template)
  buttons?: MenuButtonDTO[] // Inline keyboard buttons
}

/**
 * Create Channel Queue Request DTO
 */
export interface CreateChannelQueueRequestDTO {
  templateKey?: string
  variables?: Record<string, unknown>
  content?: string
  buttons?: MenuButtonDTO[]
  scheduledAt?: string // ISO 8601 date string (optional, null = send immediately)
}

// Legacy exports for backward compatibility (deprecated)
/**
 * @deprecated Use UserDTO instead
 */
export type UserProfile = UserDTO

/**
 * @deprecated Use AuthResponseDTO instead
 */
export interface AuthResponse {
  token: string
  user: UserDTO
}
