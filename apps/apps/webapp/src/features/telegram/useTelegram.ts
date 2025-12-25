import { useMemo } from 'react'
import { getTelegramWebApp, isTelegramWebApp } from './tg'

/**
 * Hook для работы с Telegram WebApp
 */
export function useTelegram() {
  return useMemo(() => {
    const isAvailable = isTelegramWebApp()
    const tg = getTelegramWebApp()

    if (!isAvailable || !tg) {
      return {
        isAvailable: false,
        initData: '',
        user: null,
        ready: () => {},
        expand: () => {},
      }
    }

    // Инициализация WebApp
    try {
      tg.ready?.()
      tg.expand?.()
    } catch (error) {
      console.warn('[useTelegram] Error initializing WebApp:', error)
    }

    const initData = tg.initData || ''
    const user = tg.initDataUnsafe?.user || null

    return {
      isAvailable: true,
      initData,
      user,
      ready: tg.ready || (() => {}),
      expand: tg.expand || (() => {}),
      tg, // Полный объект для расширенного использования
    }
  }, [])
}
