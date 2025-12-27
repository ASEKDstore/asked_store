// AdminGate component - protects admin routes/sections

import React, { ReactNode } from 'react'
import { useAuth } from './AuthContext.js'

interface AdminGateProps {
  children: ReactNode
  fallback?: ReactNode
  requirePermission?: string // Optional: require specific permission (e.g., 'admin.access')
}

/**
 * AdminGate component - renders children only if user has admin access
 * 
 * @example
 * <AdminGate>
 *   <AdminPanel />
 * </AdminGate>
 * 
 * @example
 * <AdminGate requirePermission="catalog.write">
 *   <CatalogEditor />
 * </AdminGate>
 */
export function AdminGate({ children, fallback, requirePermission = 'admin.access' }: AdminGateProps) {
  const { isAdmin, roles, isLoading } = useAuth()

  // Show nothing while loading
  if (isLoading) {
    return fallback || null
  }

  // Check if user has admin role (owner or admin)
  if (!isAdmin) {
    return (
      fallback || (
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <h2>Доступ запрещен</h2>
          <p>У вас нет прав доступа к этому разделу.</p>
        </div>
      )
    )
  }

  // For future: check specific permission if provided
  // Currently, isAdmin covers admin.access permission
  // If requirePermission is different, we'd need to check it here

  return <>{children}</>
}

