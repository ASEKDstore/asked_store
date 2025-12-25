import { useEffect } from 'react'
import { getTelegramWebApp } from './tg'

/**
 * Hook для применения темы Telegram
 * Устанавливает CSS переменные на основе tg.themeParams
 */
export function useTgTheme() {
  useEffect(() => {
    const tg = getTelegramWebApp()
    if (!tg) return

    const updateTheme = () => {
      const theme = tg.themeParams || {}
      const root = document.documentElement

      // Устанавливаем CSS переменные
      if (theme.bg_color) {
        root.style.setProperty('--tg-bg', theme.bg_color)
      }
      if (theme.text_color) {
        root.style.setProperty('--tg-text', theme.text_color)
      }
      if (theme.hint_color) {
        root.style.setProperty('--tg-hint', theme.hint_color)
      }
      if (theme.link_color) {
        root.style.setProperty('--tg-link', theme.link_color)
      }
      if (theme.button_color) {
        root.style.setProperty('--tg-button', theme.button_color)
      }
      if (theme.button_text_color) {
        root.style.setProperty('--tg-button-text', theme.button_text_color)
      }
      if (theme.secondary_bg_color) {
        root.style.setProperty('--tg-secondary-bg', theme.secondary_bg_color)
      }
    }

    // Применяем тему сразу
    updateTheme()

    // Слушаем изменения темы
    if (tg.onEvent) {
      tg.onEvent('themeChanged', updateTheme)
    }

    return () => {
      if (tg.offEvent) {
        tg.offEvent('themeChanged', updateTheme)
      }
    }
  }, [])
}
