// RBAC guard middleware

import { Request, Response, NextFunction } from 'express'
import { prisma } from '../prisma.js'
import type { JWTPayload } from '@asked-store/shared'

/**
 * RBAC Guard middleware factory
 * Checks if user has the required permission
 * 
 * @param permissionKey - Permission key in format "resource:action" (e.g., "user:read", "product:create")
 * @returns Express middleware function
 * 
 * @example
 * router.get('/users', verifyJwt, rbacGuard('user:read'), handler)
 */
export function rbacGuard(permissionKey: string) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userPayload = req.user as JWTPayload | undefined
      if (!userPayload || !userPayload.sub) {
        res.status(401).json({ error: 'Unauthorized: User not authenticated' })
        return
      }

      const userId = userPayload.sub
      const userRoles = userPayload.roles || []

      // If user has no roles, deny access
      if (userRoles.length === 0) {
        res.status(403).json({ error: 'Forbidden: User has no roles assigned' })
        return
      }

      // Find permission by key
      const permission = await prisma.permission.findUnique({
        where: { name: permissionKey },
        include: {
          rolePermissions: {
            include: {
              role: true,
            },
          },
        },
      })

      if (!permission) {
        // Permission doesn't exist in DB, deny access
        res.status(403).json({ error: `Forbidden: Permission "${permissionKey}" does not exist` })
        return
      }

      // Check if any of user's roles have this permission
      const rolesWithPermission = permission.rolePermissions.map((rp) => rp.role.name)
      const hasPermission = userRoles.some((role) => rolesWithPermission.includes(role))

      if (!hasPermission) {
        res.status(403).json({ 
          error: `Forbidden: User does not have permission "${permissionKey}"`,
          required: permissionKey,
          userRoles: userRoles,
        })
        return
      }

      // User has permission, continue
      next()
    } catch (error) {
      console.error('RBAC guard error:', error)
      res.status(500).json({ error: 'Internal server error: Permission check failed' })
    }
  }
}

