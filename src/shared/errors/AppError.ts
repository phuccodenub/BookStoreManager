import { StatusCodes } from 'http-status-codes';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(
    statusCode: number,
    code: string,
    message: string,
    details?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message: string, details?: unknown) {
    return new AppError(StatusCodes.BAD_REQUEST, 'BAD_REQUEST', message, details);
  }

  static unauthorized(message = 'Unauthorized') {
    return new AppError(StatusCodes.UNAUTHORIZED, 'UNAUTHORIZED', message);
  }

  static forbidden(message = 'Forbidden') {
    return new AppError(StatusCodes.FORBIDDEN, 'FORBIDDEN', message);
  }

  static notFound(resource = 'Resource') {
    return new AppError(StatusCodes.NOT_FOUND, 'NOT_FOUND', `${resource} not found`);
  }

  static conflict(message: string) {
    return new AppError(StatusCodes.CONFLICT, 'CONFLICT', message);
  }

  static serviceUnavailable(message = 'Service unavailable', details?: unknown) {
    return new AppError(StatusCodes.SERVICE_UNAVAILABLE, 'SERVICE_UNAVAILABLE', message, details);
  }

  static tooManyRequests(message = 'Too many requests') {
    return new AppError(StatusCodes.TOO_MANY_REQUESTS, 'TOO_MANY_REQUESTS', message);
  }

  static internal(message = 'Internal server error') {
    return new AppError(StatusCodes.INTERNAL_SERVER_ERROR, 'INTERNAL_ERROR', message);
  }
}
