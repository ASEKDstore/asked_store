// Telegram WebApp integration hook

import { useState, useEffect } from 'react'

interface TelegramWebApp {
  initData: string
  initDataUnsafe: {
    user?: {
      id: number
      first_name?: string
      last_name?: string
      username?: string
      photo_url?: string
    }
  }
  ready: () => void
  expand: () => void
  MainButton: {
    text: string
    show: () => void
    hide: () => void
    onClick: (callback: () => void) => void
    offClick: (callback: () => void) => void
    setText: (text: string) => void
  }
  BackButton: {
    show: () => void
    hide: () => void
    onClick: (callback: () => void) => void
    offClick: (callback: () => void) => void
  }
  HapticFeedback: {
    impactOccurred: (style?: 'light' | 'medium' | 'heavy') => void
  }
  themeParams: {
    bg_color?: string
    text_color?: string
    hint_color?: string
    link_color?: string
    button_color?: string
    button_text_color?: string
  }
  onEvent: (event: string, callback: () => void) => void
  offEvent: (event: string, callback: () => void) => void
}

declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp
    }
  }
}

/**
 * Hook to access Telegram WebApp API
 */
export function useTelegram() {
  const [telegram, setTelegram] = useState<TelegramWebApp | null>(null)
  const [isAvailable, setIsAvailable] = useState(false)
  const [initData, setInitData] = useState<string | null>(null)

  useEffect(() => {
    const tg = window.Telegram?.WebApp

    if (tg) {
      setIsAvailable(true)
      setTelegram(tg)
      setInitData(tg.initData || '')
      
      // Initialize Telegram WebApp
      tg.ready()
      tg.expand()
    } else {
      setIsAvailable(false)
      setTelegram(null)
      setInitData(null)
    }
  }, [])

  return {
    telegram,
    isAvailable,
    initData: initData || null,
    user: telegram?.initDataUnsafe?.user || null,
  }
}

