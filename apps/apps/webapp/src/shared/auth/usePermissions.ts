// Hook for checking user permissions

import { useAuth } from './AuthContext.js'
import { useMemo } from 'react'

/**
 * Hook to check if user has specific permission
 * Returns helper functions for common permission checks
 */
export function usePermissions() {
  const { roles } = useAuth()

  const hasPermission = useMemo(() => {
    // Map of role names to permission sets
    // This is a simplified version - in a real app, you might want to fetch permissions from the backend
    const rolePermissions: Record<string, string[]> = {
      owner: ['admin.access', 'channel.write', 'catalog.write', 'orders.read'],
      admin: ['admin.access', 'channel.write', 'catalog.write', 'orders.read'],
      content: ['catalog.write', 'catalog.read'],
      support: ['orders.read'],
      analyst: ['catalog.read', 'orders.read'],
      user: ['catalog.read'],
    }

    const userPermissions = new Set<string>()
    for (const role of roles) {
      const permissions = rolePermissions[role] || []
      for (const perm of permissions) {
        userPermissions.add(perm)
      }
    }

    return (permission: string): boolean => {
      return userPermissions.has(permission)
    }
  }, [roles])

  const isAdmin = useMemo(() => {
    return roles.includes('admin') || roles.includes('owner')
  }, [roles])

  const hasAdminAccess = useMemo(() => {
    return hasPermission('admin.access')
  }, [hasPermission])

  const hasChannelWrite = useMemo(() => {
    return hasPermission('channel.write')
  }, [hasPermission])

  const hasChannelAdminAccess = useMemo(() => {
    // Channel admin requires both admin.access and channel.write
    return hasAdminAccess && hasChannelWrite
  }, [hasAdminAccess, hasChannelWrite])

  return {
    hasPermission,
    isAdmin,
    hasAdminAccess,
    hasChannelWrite,
    hasChannelAdminAccess,
  }
}

