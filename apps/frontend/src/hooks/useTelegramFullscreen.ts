import { useEffect } from 'react'

/**
 * Hook to initialize Telegram WebApp fullscreen mode
 * - Calls ready() and expand() for fullscreen
 * - Sets header and background colors (optional)
 * - Handles safe-area insets via CSS
 */
export function useTelegramFullscreen() {
  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp
    if (!tg) return

    try {
      // Initialize WebApp
      tg.ready?.()
      tg.expand?.()

      // Optional: Set header and background colors to match app theme
      // Uncomment if needed:
      // tg.setHeaderColor?.('#0a0a0a')
      // tg.setBackgroundColor?.('#0a0a0a')

      if (import.meta.env.DEV) {
        console.log('[TG FULLSCREEN] Initialized', {
          viewportHeight: tg.viewportHeight,
          viewportStableHeight: tg.viewportStableHeight,
        })
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn('[TG FULLSCREEN] Error:', error)
      }
    }
  }, [])
}

