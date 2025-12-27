// JWT authentication middleware (deprecated: use verifyJwt instead)

import { Request, Response, NextFunction } from 'express'
import { verifyJwt } from './verifyJwt.js'

/**
 * @deprecated Use verifyJwt instead
 * Middleware to require authentication
 * Validates JWT token and attaches user to request
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  verifyJwt(req, res, next)
}

