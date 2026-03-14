import type { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ZodError } from 'zod';
import { AppError } from './AppError.js';
import { logger } from '../logger/index.js';

export function globalErrorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const requestId = (req as unknown as Record<string, unknown>)['requestId'] as string | undefined;

  /* --- AppError (expected) --- */
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details ?? null,
        requestId: requestId ?? null,
      },
    });
    return;
  }

  /* --- ZodError (validation) --- */
  if (err instanceof ZodError) {
    res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: err.flatten().fieldErrors,
        requestId: requestId ?? null,
      },
    });
    return;
  }

  /* --- Unknown / unexpected --- */
  const message = err instanceof Error ? err.message : 'Unknown error';
  logger.error({ err, requestId }, 'Unhandled error');

  res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: process.env['NODE_ENV'] === 'production' ? 'Internal server error' : message,
      requestId: requestId ?? null,
    },
  });
}
