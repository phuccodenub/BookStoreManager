import type { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { AppError } from './AppError.js';
import { logger } from '../logger/index.js';

function buildUniqueConstraintMessage(target: unknown): string {
  if (Array.isArray(target) && target.length > 0) {
    return `Duplicate value for ${target.join(', ')}`;
  }

  if (typeof target === 'string' && target.length > 0) {
    return `Duplicate value for ${target}`;
  }

  return 'Resource already exists';
}

function mapUnexpectedError(err: unknown): AppError | null {
  if (err instanceof Prisma.PrismaClientInitializationError) {
    return AppError.serviceUnavailable(
      'Database connection is unavailable. Check PostgreSQL and backend DATABASE_URL.',
    );
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2002':
        return AppError.conflict(buildUniqueConstraintMessage(err.meta?.['target']));
      case 'P2003':
        return AppError.badRequest('Referenced resource does not exist');
      case 'P2025':
        return AppError.notFound();
      default:
        return null;
    }
  }

  return null;
}

export function globalErrorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const requestId = (req as unknown as Record<string, unknown>)['requestId'] as string | undefined;
  const mappedError = mapUnexpectedError(err);

  /* --- AppError (expected) --- */
  if (err instanceof AppError || mappedError) {
    const appError = (mappedError ?? err) as AppError;
    res.status(appError.statusCode).json({
      success: false,
      error: {
        code: appError.code,
        message: appError.message,
        details: appError.details ?? null,
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
