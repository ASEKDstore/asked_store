import type { Request, Response, NextFunction } from 'express'

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
) {
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

