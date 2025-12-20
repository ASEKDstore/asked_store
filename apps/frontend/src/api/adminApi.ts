import { requestJson, request } from '../lib/apiClient'

/**
 * Admin API client
 * All endpoints require admin authentication
 */

function useAdminApi() {
  return {
    // Bot Flows (Extended API)
    getBotFlows: () =>
      requestJson('/api/admin/bot/flows'),

    getBotFlow: (id: string) =>
      requestJson(`/api/admin/bot/flows/${id}`),

    createBotFlow: (data: any) =>
      requestJson('/api/admin/bot/flows', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    updateBotFlow: (id: string, data: any) =>
      requestJson(`/api/admin/bot/flows/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    deleteBotFlow: (id: string) =>
      request(`/api/admin/bot/flows/${id}`, {
        method: 'DELETE',
      }),

    duplicateBotFlow: (id: string, data?: { key?: string; name?: string }) =>
      requestJson(`/api/admin/bot/flows/${id}/duplicate`, {
        method: 'POST',
        body: JSON.stringify(data || {}),
      }),

    publishBotFlow: (id: string, adminTgId: number) =>
      requestJson(`/api/admin/bot/flows/${id}/publish`, {
        method: 'POST',
        body: JSON.stringify({ adminTgId }),
      }),

    rollbackBotFlow: (id: string, version: number, adminTgId: number) =>
      requestJson(`/api/admin/bot/flows/${id}/rollback`, {
        method: 'POST',
        body: JSON.stringify({ version, adminTgId }),
      }),

    archiveBotFlow: (id: string) =>
      requestJson(`/api/admin/bot/flows/${id}/archive`, {
        method: 'POST',
      }),

    getBotFlowNodes: (flowId: string) =>
      requestJson(`/api/admin/bot/flows/${flowId}/nodes`),

    updateBotFlowNodes: (flowId: string, nodes: any[]) =>
      requestJson(`/api/admin/bot/flows/${flowId}/nodes`, {
        method: 'PUT',
        body: JSON.stringify(nodes),
      }),

    // Preview
    previewBotFlow: (data: {
      flowId: string
      version?: 'draft' | number
      state?: any
      event?: { type: 'start' | 'callback' | 'text' | 'webapp'; value?: string; payload?: any }
      telegramUserId?: bigint
    }) =>
      requestJson('/api/admin/bot/preview/run', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    // Legacy (for backward compatibility)
    testBotFlow: (id: string, stepId?: string) =>
      requestJson(`/api/admin/bot/flows/${id}/test`, {
        method: 'POST',
        body: JSON.stringify({ stepId }),
      }),

    // ... existing admin API methods ...
    getOrders: () =>
      requestJson('/api/admin/orders'),

    getOrder: (id: string) =>
      requestJson(`/api/admin/orders/${id}`),

    updateOrderStatus: (id: string, status: string) =>
      requestJson(`/api/admin/orders/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      }),

    getProducts: () =>
      requestJson('/api/admin/products'),

    getProduct: (id: string) =>
      requestJson(`/api/admin/products/${id}`),

    createProduct: (data: any) =>
      requestJson('/api/admin/products', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    updateProduct: (id: string, data: any) =>
      requestJson(`/api/admin/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    deleteProduct: (id: string) =>
      request(`/api/admin/products/${id}`, {
        method: 'DELETE',
      }),

    getBanners: () =>
      requestJson('/api/admin/banners'),

    getBanner: (id: string) =>
      requestJson(`/api/admin/banners/${id}`),

    createBanner: (data: any) =>
      requestJson('/api/admin/banners', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    updateBanner: (id: string, data: any) =>
      requestJson(`/api/admin/banners/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    deleteBanner: (id: string) =>
      request(`/api/admin/banners/${id}`, {
        method: 'DELETE',
      }),

    getPromos: () =>
      requestJson('/api/admin/promos'),

    getPromo: (id: string) =>
      requestJson(`/api/admin/promos/${id}`),

    createPromo: (data: any) =>
      requestJson('/api/admin/promos', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    updatePromo: (id: string, data: any) =>
      requestJson(`/api/admin/promos/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    deletePromo: (id: string) =>
      request(`/api/admin/promos/${id}`, {
        method: 'DELETE',
      }),

    getSettings: () =>
      requestJson('/api/admin/settings'),

    updateSetting: (key: string, value: any) =>
      requestJson(`/api/admin/settings/${key}`, {
        method: 'PUT',
        body: JSON.stringify({ value }),
      }),

    getStats: () =>
      requestJson('/api/admin/stats'),

    getAdmins: () =>
      requestJson('/api/admin/admins'),

    createAdmin: (data: any) =>
      requestJson('/api/admin/admins', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    deleteAdmin: (tgId: number) =>
      request(`/api/admin/admins/${tgId}`, {
        method: 'DELETE',
      }),

    getTelegramSubscribers: () =>
      requestJson('/api/admin/telegram/subscribers'),

    toggleTelegramSubscriber: (tgId: number) =>
      request(`/api/admin/telegram/subscribers/${tgId}/toggle`, {
        method: 'POST',
      }),
  }
}

export { useAdminApi }
