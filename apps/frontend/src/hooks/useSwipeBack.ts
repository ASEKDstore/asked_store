import { useEffect, useRef, RefObject } from 'react'
import { useNavigate } from 'react-router-dom'

/**
 * Hook for swipe-back gesture (iOS-style: swipe from left edge to right = back)
 * Optimized for Telegram Android WebApp
 * 
 * @param scrollElementRef - Ref to the scrollable container element (.app-scroll)
 */
export function useSwipeBack(scrollElementRef: RefObject<HTMLElement>) {
  const navigate = useNavigate()
  const startXRef = useRef<number | null>(null)
  const startYRef = useRef<number | null>(null)

  useEffect(() => {
    const scrollElement = scrollElementRef.current
    if (!scrollElement) {
      return
    }

    const handlePointerDown = (e: PointerEvent) => {
      // Only start if pointer is in the left edge (first 24px)
      if (e.clientX > 24) {
        return
      }

      // Ignore if target is input, textarea, select, button, a, or inside [data-no-swipe]
      const target = e.target as HTMLElement
      if (target.closest('input, textarea, select, button, a, [role="slider"], [role="spinbutton"], [data-no-swipe]')) {
        return
      }

      startXRef.current = e.clientX
      startYRef.current = e.clientY
    }

    const handlePointerMove = (e: PointerEvent) => {
      // Early exit if no start position
      if (startXRef.current === null || startYRef.current === null) {
        return
      }

      // Don't prevent default - allow vertical scrolling
      // We only track the gesture, not block it
    }

    const handlePointerUp = (e: PointerEvent) => {
      // Early exit if no start position
      if (startXRef.current === null || startYRef.current === null) {
        return
      }

      // Safe to compute dx/dy as numbers after null checks
      const dx = e.clientX - startXRef.current
      const dy = Math.abs(e.clientY - startYRef.current)
      const threshold = 80 // Minimum swipe distance in pixels

      // Condition: dx >= 80 && dx > abs(dy)
      // This ensures horizontal swipe is greater than vertical (doesn't block vertical scroll)
      if (dx >= threshold && dx > dy) {
        // Swipe back triggered
        if (window.history.length > 1) {
          navigate(-1)
        } else {
          navigate('/')
        }
      }

      // Reset
      startXRef.current = null
      startYRef.current = null
    }

    const handlePointerCancel = () => {
      // Reset on cancel
      startXRef.current = null
      startYRef.current = null
    }

    // Attach listeners ONLY to scroll container
    scrollElement.addEventListener('pointerdown', handlePointerDown, { passive: true })
    scrollElement.addEventListener('pointermove', handlePointerMove, { passive: true })
    scrollElement.addEventListener('pointerup', handlePointerUp, { passive: true })
    scrollElement.addEventListener('pointercancel', handlePointerCancel, { passive: true })

    return () => {
      scrollElement.removeEventListener('pointerdown', handlePointerDown)
      scrollElement.removeEventListener('pointermove', handlePointerMove)
      scrollElement.removeEventListener('pointerup', handlePointerUp)
      scrollElement.removeEventListener('pointercancel', handlePointerCancel)
    }
  }, [navigate, scrollElementRef])
}

