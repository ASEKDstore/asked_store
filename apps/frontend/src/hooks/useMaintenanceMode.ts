import { useState, useEffect } from 'react'
import { useUser } from '../context/UserContext'
import { isAdminId } from '../config/admins'

import { requestJson } from '../lib/apiClient'

export function useMaintenanceMode() {
  const { user } = useUser()
  const [maintenanceMode, setMaintenanceMode] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkMaintenance = async () => {
      try {
        const data = await requestJson<{ maintenanceMode?: boolean }>('/api/settings', { skipAuth: true })
        setMaintenanceMode(data.maintenanceMode || false)
      } catch (error) {
        console.error('Failed to check maintenance mode:', error)
      } finally {
        setLoading(false)
      }
    }

    checkMaintenance()
  }, [])

  const isAdmin = user.tgId ? isAdminId(user.tgId) : false
  const shouldBlock = maintenanceMode && !isAdmin

  return { maintenanceMode, loading, shouldBlock, isAdmin }
}



