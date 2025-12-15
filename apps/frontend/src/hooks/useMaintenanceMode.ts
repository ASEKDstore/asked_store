import { useState, useEffect } from 'react'
import { useUser } from '../context/UserContext'
import { isAdminId } from '../config/admins'

import { apiUrl } from '../utils/api'

export function useMaintenanceMode() {
  const { user } = useUser()
  const [maintenanceMode, setMaintenanceMode] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkMaintenance = async () => {
      try {
        const response = await fetch(apiUrl('/api/settings'))
        if (response.ok) {
          const data = await response.json()
          setMaintenanceMode(data.maintenanceMode || false)
        }
      } catch (error) {
        console.error('Failed to check maintenance mode:', error)
      } finally {
        setLoading(false)
      }
    }

    checkMaintenance()
  }, [])

  const isAdmin = user ? isAdminId(user.id) : false
  const shouldBlock = maintenanceMode && !isAdmin

  return { maintenanceMode, loading, shouldBlock, isAdmin }
}



