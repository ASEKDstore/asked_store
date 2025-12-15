import { useState, useEffect } from 'react'

type AuthState = 'authenticated' | 'unauthenticated' | 'authenticating'

export function useLoadingProgress(authState: AuthState) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    let interval: ReturnType<typeof window.setInterval> | null = null

    if (authState === 'authenticated') {
      // If authenticated, progress goes to 100%
      interval = window.setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            if (interval !== null) window.clearInterval(interval)
            return 100
          }
          return Math.min(prev + 2, 100)
        })
      }, 50)
    } else if (authState === 'unauthenticated') {
      // If not authenticated, progress stops at 30-40%
      interval = window.setInterval(() => {
        setProgress(prev => {
          if (prev >= 35) {
            if (interval !== null) window.clearInterval(interval)
            return 35
          }
          return prev + 1
        })
      }, 80)
    } else if (authState === 'authenticating') {
      // If authenticating, continue progress
      interval = window.setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            if (interval !== null) window.clearInterval(interval)
            return 100
          }
          return Math.min(prev + 3, 100)
        })
      }, 40)
    }

    return () => {
      if (interval !== null) window.clearInterval(interval)
    }
  }, [authState])

  return progress
}


