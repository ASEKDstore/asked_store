import { useState, useEffect, useRef } from 'react'

type AuthState = 'authenticated' | 'unauthenticated' | 'authenticating'

/**
 * Loading progress hook
 * ALWAYS reaches 100% regardless of auth state (guest mode supported)
 */
export function useLoadingProgress(authState: AuthState) {
  const [progress, setProgress] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    // Clear previous interval if exists
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    // ALWAYS progress to 100% regardless of auth state
    // Guest mode is fully supported - no blocking
    intervalRef.current = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          if (intervalRef.current !== null) {
            clearInterval(intervalRef.current)
            intervalRef.current = null
          }
          return 100
        }
        // Faster progress for authenticated users, but still completes for guests
        const increment = authState === 'authenticated' ? 3 : 2
        return Math.min(prev + increment, 100)
      })
    }, 50)

    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [authState])

  return progress
}


