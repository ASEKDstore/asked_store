import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../context/UserContext'

/**
 * Component to handle 403 errors in admin pages
 * Redirects to regular mode if user is not admin
 */
export function AdminErrorHandler({ error }: { error: Error | null }) {
  const navigate = useNavigate()
  const { user } = useUser()

  useEffect(() => {
    if (error && error.message.includes('403')) {
      // User is not admin, redirect to regular mode
      if (user.source === 'guest' || !user.isAdmin) {
        navigate('/app')
      }
    }
  }, [error, navigate, user])

  return null
}

