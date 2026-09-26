import type { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
}

export function errorHandler(
  err: AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode = err.statusCode || 500;
  const isProd = process.env.NODE_ENV === 'production';

  console.error(`[Error] ${req.method} ${req.url} - ${err.message}`);

  res.status(statusCode).json({
    error: {
      code: err.code || 'INTERNAL_SERVER_ERROR',
      message: isProd && statusCode === 500 ? 'An unexpected server error occurred.' : err.message,
    },
    status: statusCode,
    timestamp: new Date().toISOString(),
  });
}
