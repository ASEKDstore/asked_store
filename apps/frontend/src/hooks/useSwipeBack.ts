import { useEffect, useRef, RefObject } from 'react'
import { useNavigate } from 'react-router-dom'

/**
 * Hook for swipe-back gesture (iOS-style: swipe from left edge to right = back)
 * Works on mobile/touch devices including Telegram WebApp
 * 
 * @param scrollElementRef - Ref to the scrollable container element (.app-scroll)
 */
export function useSwipeBack(scrollElementRef: RefObject<HTMLElement>) {
  const navigate = useNavigate()
  const startXRef = useRef<number | null>(null)
  const startYRef = useRef<number | null>(null)
  const isSwipeRef = useRef(false)

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

      // Ignore if target is input, textarea, select, or inside one
      // Also ignore if inside elements with data-no-swipe (e.g., horizontal carousels)
      const target = e.target as HTMLElement
      if (target.closest('input, textarea, select, [role="slider"], [role="spinbutton"], [data-no-swipe]')) {
        return
      }

      startXRef.current = e.clientX
      startYRef.current = e.clientY
      isSwipeRef.current = false
    }

    const handlePointerMove = (e: PointerEvent) => {
      if (startXRef.current === null || startYRef.current === null) {
        return
      }

      const dx = e.clientX - startXRef.current
      const dy = e.clientY - startYRef.current

      // Ignore if gesture is more vertical than horizontal
      if (Math.abs(dy) > Math.abs(dx)) {
        startXRef.current = null
        startYRef.current = null
        return
      }

      // Only consider rightward swipe (positive dx)
      if (dx > 0) {
        isSwipeRef.current = true
      }
    }

    const handlePointerUp = (e: PointerEvent) => {
      // Early exit if start positions are null or swipe not detected
      if (startXRef.current === null || startYRef.current === null || !isSwipeRef.current) {
        startXRef.current = null
        startYRef.current = null
        isSwipeRef.current = false
        return
      }

      // Safe to compute dx/dy as numbers after null checks
      const dx = e.clientX - startXRef.current
      const dy = Math.abs(e.clientY - startYRef.current)
      const threshold = 80 // Minimum swipe distance in pixels

      // Only trigger if horizontal swipe is greater than vertical (dx > abs(dy))
      if (dx >= threshold && dx > dy) {
        // Swipe back triggered
        if (window.history.length > 1) {
          navigate(-1)
        } else {
          navigate('/')
        }
      }

      startXRef.current = null
      startYRef.current = null
      isSwipeRef.current = false
    }

    // Attach listeners to scroll container, not document
    scrollElement.addEventListener('pointerdown', handlePointerDown)
    scrollElement.addEventListener('pointermove', handlePointerMove)
    scrollElement.addEventListener('pointerup', handlePointerUp)
    scrollElement.addEventListener('pointercancel', handlePointerUp)

    return () => {
      scrollElement.removeEventListener('pointerdown', handlePointerDown)
      scrollElement.removeEventListener('pointermove', handlePointerMove)
      scrollElement.removeEventListener('pointerup', handlePointerUp)
      scrollElement.removeEventListener('pointercancel', handlePointerUp)
    }
  }, [navigate, scrollElementRef])
}

