import { useState, useEffect, useRef } from 'react'

type AuthState = 'authenticated' | 'unauthenticated' | 'authenticating'

export function useLoadingProgress(authState: AuthState) {
  const [progress, setProgress] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    // Clear previous interval if exists
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    if (authState === 'authenticated') {
      // If authenticated, progress goes to 100%
      intervalRef.current = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            if (intervalRef.current !== null) {
              clearInterval(intervalRef.current)
              intervalRef.current = null
            }
            return 100
          }
          return Math.min(prev + 2, 100)
        })
      }, 50)
    } else if (authState === 'unauthenticated') {
      // If not authenticated, progress stops at 30-40%
      intervalRef.current = setInterval(() => {
        setProgress(prev => {
          if (prev >= 35) {
            if (intervalRef.current !== null) {
              clearInterval(intervalRef.current)
              intervalRef.current = null
            }
            return 35
          }
          return prev + 1
        })
      }, 80)
    } else if (authState === 'authenticating') {
      // If authenticating, continue progress
      intervalRef.current = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            if (intervalRef.current !== null) {
              clearInterval(intervalRef.current)
              intervalRef.current = null
            }
            return 100
          }
          return Math.min(prev + 3, 100)
        })
      }, 40)
    }

    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [authState])

  return progress
}


