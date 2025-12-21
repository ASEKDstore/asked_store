import { useEffect } from 'react'

/**
 * Hook to manage Telegram WebApp viewport height
 * Sets CSS variable --app-height based on Telegram.WebApp.viewportHeight
 * Falls back to window.innerHeight or 100dvh
 */
export function useTgViewport() {
  useEffect(() => {
    const updateHeight = () => {
      const tg = (window as any).Telegram?.WebApp
      let height: number

      if (tg) {
        // Prefer viewportStableHeight (doesn't change with keyboard)
        // Fallback to viewportHeight
        height = tg.viewportStableHeight || tg.viewportHeight || window.innerHeight
      } else {
        // Fallback for non-Telegram environment
        height = window.innerHeight
      }

      // Set CSS variable
      document.documentElement.style.setProperty('--app-height', `${height}px`)
      
      if (import.meta.env.DEV) {
        console.log('[TG VIEWPORT] Updated --app-height:', height)
      }
    }

    // Initial update
    updateHeight()

    // Expand Telegram WebApp to full height (one time)
    const tg = (window as any).Telegram?.WebApp
    if (tg?.expand) {
      tg.expand()
    }

    // Listen for viewport changes (Telegram WebApp event)
    const handleViewportChanged = () => {
      updateHeight()
    }

    if (tg?.onEvent) {
      tg.onEvent('viewportChanged', handleViewportChanged)
    }

    // Also listen to window resize as fallback
    window.addEventListener('resize', updateHeight)

    // Cleanup
    return () => {
      if (tg?.offEvent) {
        tg.offEvent('viewportChanged', handleViewportChanged)
      }
      window.removeEventListener('resize', updateHeight)
    }
  }, [])
}

