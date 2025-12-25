/**
 * Thin wrapper над Telegram.WebApp API
 * Безопасно получает доступ к window.Telegram.WebApp
 */

export interface TelegramWebApp {
  initData: string
  initDataUnsafe?: {
    user?: {
      id: number
      first_name?: string
      last_name?: string
      username?: string
      photo_url?: string
    }
  }
  ready?: () => void
  expand?: () => void
  close?: () => void
  BackButton?: {
    show: () => void
    hide: () => void
    onClick: (callback: () => void) => void
    offClick: (callback: () => void) => void
    isVisible: boolean
  }
  MainButton?: {
    text: string
    color: string
    textColor: string
    isVisible: boolean
    isActive: boolean
    isProgressVisible: boolean
    setText: (text: string) => void
    onClick: (callback: () => void) => void
    offClick: (callback: () => void) => void
    show: () => void
    hide: () => void
    enable: () => void
    disable: () => void
    showProgress: (leaveActive?: boolean) => void
    hideProgress: () => void
    setParams: (params: { text?: string; color?: string; text_color?: string; is_active?: boolean; is_visible?: boolean }) => void
  }
  HapticFeedback?: {
    impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void
    notificationOccurred: (type: 'error' | 'success' | 'warning') => void
    selectionChanged: () => void
  }
  themeParams?: {
    bg_color?: string
    text_color?: string
    hint_color?: string
    link_color?: string
    button_color?: string
    button_text_color?: string
    secondary_bg_color?: string
  }
  version?: string
  platform?: string
  colorScheme?: 'light' | 'dark'
  onEvent?: (eventType: string, eventData: Record<string, unknown>) => void
  offEvent?: (eventType: string, eventData: Record<string, unknown>) => void
  sendData?: (data: string) => void
}

declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp
    }
  }
}

/**
 * Получить Telegram WebApp instance
 */
export function getTelegramWebApp(): TelegramWebApp | null {
  return window.Telegram?.WebApp || null
}

/**
 * Проверить доступность Telegram WebApp
 */
export function isTelegramWebApp(): boolean {
  return !!window.Telegram?.WebApp
}
