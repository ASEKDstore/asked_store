import type { Request, Response, NextFunction } from 'express'
import { Prisma } from '@prisma/client'

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  // Handle Prisma errors (missing tables, connection issues, etc.)
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    // Check if it's a table/relation missing error
    if (err.code === 'P2021' || err.code === 'P2001' || err.message?.includes('does not exist')) {
      console.error('[API ERROR] Database migration error:', {
        code: err.code,
        message: err.message,
        method: req.method,
        url: req.originalUrl,
      })
      return res.status(503).json({
        error: 'Database not migrated',
        message: 'The database schema is not up to date. Please run migrations.',
      })
    }
  }

  // Handle generic Prisma errors
  if (err?.constructor?.name === 'PrismaClientKnownRequestError' || err?.name === 'PrismaClientKnownRequestError') {
    if (err.message?.includes('does not exist') || err.message?.includes('table')) {
      console.error('[API ERROR] Database table missing:', {
        message: err.message,
        method: req.method,
        url: req.originalUrl,
      })
      return res.status(503).json({
        error: 'Database not migrated',
        message: 'The database schema is not up to date. Please run migrations.',
      })
    }
  }

  const status = Number(err?.status) || Number(err?.statusCode) || 500

  console.error('[API ERROR]', {
    status,
    method: req.method,
    url: req.originalUrl,
    message: err?.message,
    stack: err?.stack,
    body: req.body,
  })

  res.status(status).json({
    message: err?.message ?? 'Internal Server Error',
    ...(process.env.NODE_ENV !== 'production' && { stack: err?.stack }),
  })
}

