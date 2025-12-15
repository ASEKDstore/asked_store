import { useUser } from '../context/UserContext'
import { apiUrl } from '../utils/api'

/**
 * Единый fetch wrapper для админки
 * Всегда добавляет x-tg-id header
 * Читает res.text() до проверки res.ok
 */
async function adminFetch<T>(
  endpoint: string,
  tgId: number,
  options: RequestInit = {}
): Promise<T> {
  if (!tgId) {
    throw new Error('No tgId')
  }

  const url = apiUrl(endpoint)
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-tg-id': String(tgId),
      ...options.headers,
    },
  })

  // ВСЕГДА читаем response.text() ДО проверки res.ok
  const text = await response.text().catch(() => '')

  if (!response.ok) {
    // Пытаемся распарсить JSON для получения message
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`
    try {
      const errorData = text ? JSON.parse(text) : {}
      if (errorData.message) {
        errorMessage = `HTTP ${response.status}: ${errorData.message}`
      } else if (text) {
        errorMessage = `HTTP ${response.status}: ${text}`
      }
    } catch {
      // Если не JSON, показываем текст ответа
      if (text) {
        errorMessage = `HTTP ${response.status}: ${text}`
      }
    }
    throw new Error(errorMessage)
  }

  // Парсим JSON только если response.ok
  return text ? JSON.parse(text) : ({} as T)
}

export function createAdminApi(tgId: number) {
  return {
    // Orders
    getOrders: (params?: { status?: string; q?: string; from?: string; to?: string }) => {
      const query = new URLSearchParams()
      if (params?.status) query.append('status', params.status)
      if (params?.q) query.append('q', params.q)
      if (params?.from) query.append('from', params.from)
      if (params?.to) query.append('to', params.to)
      const queryString = query.toString()
      return adminFetch(`/api/admin/orders${queryString ? `?${queryString}` : ''}`, tgId)
    },

    getOrder: (id: string) =>
      adminFetch(`/api/admin/orders/${id}`, tgId),

    patchOrder: (id: string, status: string) =>
      adminFetch(`/api/admin/orders/${id}`, tgId, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),

    // Products
    getProducts: (params?: { q?: string; category?: string; available?: string }) => {
      const query = new URLSearchParams()
      if (params?.q) query.append('q', params.q)
      if (params?.category) query.append('category', params.category)
      if (params?.available) query.append('available', params.available)
      const queryString = query.toString()
      return adminFetch(`/api/admin/products${queryString ? `?${queryString}` : ''}`, tgId)
    },

    createProduct: (data: any) =>
      adminFetch('/api/admin/products', tgId, {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    updateProduct: (id: string, data: any) =>
      adminFetch(`/api/admin/products/${id}`, tgId, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    deleteProduct: (id: string) =>
      adminFetch(`/api/admin/products/${id}`, tgId, {
        method: 'DELETE',
      }),

    // Promos
    getPromos: () =>
      adminFetch('/api/admin/promos', tgId),

    createPromo: (data: any) =>
      adminFetch('/api/admin/promos', tgId, {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    generatePromos: (data: any) =>
      adminFetch('/api/admin/promos/generate', tgId, {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    updatePromo: (id: string, data: any) =>
      adminFetch(`/api/admin/promos/${id}`, tgId, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),

    deletePromo: (id: string) =>
      adminFetch(`/api/admin/promos/${id}`, tgId, {
        method: 'DELETE',
      }),

    // Admins
    getAdmins: () =>
      adminFetch('/api/admin/admins', tgId),

    addAdmin: (newTgId: number) =>
      adminFetch('/api/admin/admins', tgId, {
        method: 'POST',
        body: JSON.stringify({ tgId: newTgId }),
      }),

    removeAdmin: (tgIdToRemove: number) =>
      adminFetch(`/api/admin/admins/${tgIdToRemove}`, tgId, {
        method: 'DELETE',
      }),

    // Stats
    getStats: (params?: { from?: string; to?: string }) => {
      const query = new URLSearchParams()
      if (params?.from) query.append('from', params.from)
      if (params?.to) query.append('to', params.to)
      const queryString = query.toString()
      return adminFetch(`/api/admin/stats${queryString ? `?${queryString}` : ''}`, tgId)
    },

    // Settings
    getSettings: () =>
      adminFetch('/api/admin/settings', tgId),

    patchSettings: (data: { maintenanceMode?: boolean; home?: { showBanners: boolean; showTiles: boolean; showLab: boolean } }) =>
      adminFetch('/api/admin/settings', tgId, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),

    // Telegram
    sendTelegramPost: (data: {
      mode: 'channel' | 'broadcast' | 'both'
      channelChatId: string
      text: string
      imageUrl?: string
      buttons?: Array<{ text: string; url: string }>
      parseMode?: 'HTML' | 'MarkdownV2'
      disableWebPagePreview?: boolean
    }) =>
      adminFetch('/api/admin/telegram/post', tgId, {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    // Telegram Subscribers
    getTelegramSubscribers: () =>
      adminFetch('/api/admin/telegram/subscribers', tgId),

    toggleTelegramSubscriber: (tgId: number) =>
      adminFetch(`/api/admin/telegram/subscribers/${tgId}/toggle`, tgId, {
        method: 'POST',
      }),

    // Bot Flows
    getBotFlows: () =>
      adminFetch('/api/admin/bot/flows', tgId),

    getBotFlow: (id: string) =>
      adminFetch(`/api/admin/bot/flows/${id}`, tgId),

    createBotFlow: (data: any) =>
      adminFetch('/api/admin/bot/flows', tgId, {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    updateBotFlow: (id: string, data: any) =>
      adminFetch(`/api/admin/bot/flows/${id}`, tgId, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    deleteBotFlow: (id: string) =>
      adminFetch(`/api/admin/bot/flows/${id}`, tgId, {
        method: 'DELETE',
      }),

    testBotFlow: (id: string, stepId?: string) =>
      adminFetch(`/api/admin/bot/flows/${id}/test`, tgId, {
        method: 'POST',
        body: JSON.stringify({ stepId }),
      }),

    // Banners
    getBanners: () =>
      adminFetch('/api/admin/banners', tgId),

    createBanner: (data: any) =>
      adminFetch('/api/admin/banners', tgId, {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    updateBanner: (id: string, data: any) =>
      adminFetch(`/api/admin/banners/${id}`, tgId, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    deleteBanner: (id: string) =>
      adminFetch(`/api/admin/banners/${id}`, tgId, {
        method: 'DELETE',
      }),

    // Lab Artists
    getLabArtists: () =>
      adminFetch('/api/admin/lab/artists', tgId),

    createLabArtist: (data: any) =>
      adminFetch('/api/admin/lab/artists', tgId, {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    updateLabArtist: (id: string, data: any) =>
      adminFetch(`/api/admin/lab/artists/${id}`, tgId, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    deleteLabArtist: (id: string) =>
      adminFetch(`/api/admin/lab/artists/${id}`, tgId, {
        method: 'DELETE',
      }),

    // Lab Products
    getLabProducts: (artistId?: string) => {
      const url = artistId
        ? `/api/admin/lab/products?artistId=${artistId}`
        : '/api/admin/lab/products'
      return adminFetch(url, tgId)
    },

    createLabProduct: (data: any) =>
      adminFetch('/api/admin/lab/products', tgId, {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    updateLabProduct: (id: string, data: any) =>
      adminFetch(`/api/admin/lab/products/${id}`, tgId, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    deleteLabProduct: (id: string) =>
      adminFetch(`/api/admin/lab/products/${id}`, tgId, {
        method: 'DELETE',
      }),
  }
}

// Hook version
export function useAdminApi() {
  const { user } = useUser()
  if (!user?.id) {
    throw new Error('User not authenticated')
  }
  return createAdminApi(user.id)
}

