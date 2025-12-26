// Unified error handler middleware

import { Request, Response, NextFunction } from 'express'

export interface ApiError extends Error {
  statusCode?: number
}

/**
 * Unified error handler middleware
 * Must be used last in the middleware chain
 */
export function errorHandler(
  err: ApiError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const statusCode = err.statusCode || 500
  const message = err.message || 'Internal Server Error'

  console.error(`[${req.method} ${req.path}] Error:`, err)

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  })
}

