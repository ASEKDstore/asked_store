import { useEffect, useRef } from 'react'

/**
 * Hook to manage Telegram WebApp BackButton
 * Shows/hides back button and handles onClick event
 */
export function useTelegramBackButton(onBack: () => void, show: boolean = true) {
  const onBackRef = useRef(onBack)
  const cleanupRef = useRef<(() => void) | null>(null)

  // Keep callback ref up to date
  useEffect(() => {
    onBackRef.current = onBack
  }, [onBack])

  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp
    if (!tg?.BackButton) return

    if (show) {
      // Show back button
      tg.BackButton.show()

      // Set up click handler
      const handleBack = () => {
        onBackRef.current()
      }
      tg.BackButton.onClick(handleBack)

      // Store cleanup function
      cleanupRef.current = () => {
        tg.BackButton.offClick(handleBack)
        tg.BackButton.hide()
      }

      if (import.meta.env.DEV) {
        console.log('[TG BackButton] Show')
      }
    } else {
      // Hide back button
      tg.BackButton.hide()
      cleanupRef.current = null

      if (import.meta.env.DEV) {
        console.log('[TG BackButton] Hide')
      }
    }

    // Cleanup on unmount or when show changes
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current()
        cleanupRef.current = null
      }
      // Also hide on cleanup if still showing
      if (show && tg.BackButton) {
        tg.BackButton.hide()
      }
    }
  }, [show])
}

