import { useState, useEffect } from 'react'
import { SessionExpiredScreen } from './SessionExpiredScreen'

/**
 * Global handler for session-expired events
 * Shows SessionExpiredScreen when 401 errors occur
 */
export function SessionExpiredHandler() {
  const [showExpired, setShowExpired] = useState(false)

  useEffect(() => {
    const handleSessionExpired = () => {
      console.log('[SessionExpiredHandler] Session expired event received')
      setShowExpired(true)
    }

    window.addEventListener('session-expired', handleSessionExpired)

    return () => {
      window.removeEventListener('session-expired', handleSessionExpired)
    }
  }, [])

  if (showExpired) {
    return <SessionExpiredScreen />
  }

  return null
}

