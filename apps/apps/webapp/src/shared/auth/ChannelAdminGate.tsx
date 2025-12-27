// ChannelAdminGate component - protects channel admin routes

import React, { ReactNode } from 'react'
import { usePermissions } from './usePermissions.js'

interface ChannelAdminGateProps {
  children: ReactNode
}

/**
 * ChannelAdminGate component
 * Renders children only if user has both admin.access and channel.write permissions
 */
export function ChannelAdminGate({ children }: ChannelAdminGateProps) {
  const { hasChannelAdminAccess, hasAdminAccess, hasChannelWrite } = usePermissions()

  if (!hasChannelAdminAccess) {
    const missingPermissions = []
    if (!hasAdminAccess) missingPermissions.push('admin.access')
    if (!hasChannelWrite) missingPermissions.push('channel.write')

    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>Access Denied</h2>
        <p>You must have the following permissions to access this page:</p>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {missingPermissions.map((perm) => (
            <li key={perm} style={{ padding: '4px 0' }}>
              • {perm}
            </li>
          ))}
        </ul>
      </div>
    )
  }

  return <>{children}</>
}

