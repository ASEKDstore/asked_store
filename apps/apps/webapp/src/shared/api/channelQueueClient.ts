// Channel queue API client

import { apiClient } from './apiClient.js'
import type {
  ChannelQueueItemDTO,
  CreateChannelQueueRequestDTO,
  ChannelConfigDTO,
} from '@asked-store/shared'

/**
 * Get channel config from settings
 */
export async function getChannelConfig(): Promise<ChannelConfigDTO> {
  // Get channel.config from settings endpoint
  const settings = await apiClient<any[]>('/admin/settings?scope=channel')
  const channelConfigSetting = settings.find((s) => s.key === 'channel.config')
  
  if (!channelConfigSetting) {
    throw new Error('Channel configuration not found')
  }

  return channelConfigSetting.value as ChannelConfigDTO
}

/**
 * Get all channel queue items
 */
export async function getChannelQueue(status?: 'queued' | 'sent' | 'failed'): Promise<ChannelQueueItemDTO[]> {
  const url = status ? `/admin/channel/queue?status=${status}` : '/admin/channel/queue'
  return apiClient<ChannelQueueItemDTO[]>(url)
}

/**
 * Create a new channel queue item
 */
export async function createChannelQueueItem(data: CreateChannelQueueRequestDTO): Promise<ChannelQueueItemDTO> {
  return apiClient<ChannelQueueItemDTO>('/admin/channel/queue', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

/**
 * Cancel a channel queue item
 */
export async function cancelChannelQueueItem(id: string): Promise<ChannelQueueItemDTO> {
  return apiClient<ChannelQueueItemDTO>(`/admin/channel/queue/${id}/cancel`, {
    method: 'POST',
  })
}

