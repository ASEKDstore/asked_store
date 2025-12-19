/**
 * Safe navigation utilities
 * Fallback to window.location if React Router is unavailable
 */

/**
 * Safely navigate using React Router or window.location
 * @param path - Path to navigate to
 * @param navigateFn - Optional React Router navigate function
 */
export function safeNavigate(path: string, navigateFn?: (path: string) => void): void {
  console.log('[ASKED SESSION] safeNavigate', path)
  
  if (navigateFn && typeof navigateFn === 'function') {
    try {
      navigateFn(path)
      return
    } catch (error) {
      console.warn('[ASKED SESSION] navigate function failed, using window.location:', error)
    }
  }
  
  // Fallback to window.location
  try {
    window.location.href = path
  } catch (error) {
    console.error('[ASKED SESSION] window.location.href failed:', error)
  }
}

/**
 * Safely reload the page
 */
export function safeReload(): void {
  console.log('[ASKED SESSION] safeReload')
  try {
    window.location.reload()
  } catch (error) {
    console.error('[ASKED SESSION] window.location.reload failed:', error)
  }
}

