// Unified error handler middleware

import { Request, Response, NextFunction } from 'express'
import type { ApiError } from '@asked-store/shared'

export interface ExpressApiError extends Error {
  statusCode?: number
}

/**
 * Unified error handler middleware
 * Must be used last in the middleware chain
 */
export function errorHandler(
  err: ExpressApiError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const statusCode = err.statusCode || 500
  const message = err.message || 'Internal Server Error'

  console.error(`[${req.method} ${req.path}] Error:`, err)

  const errorResponse: ApiError = {
    error: message,
    statusCode,
    ...(process.env.NODE_ENV === 'development' && { details: err.stack }),
  }

  res.status(statusCode).json(errorResponse)
}

