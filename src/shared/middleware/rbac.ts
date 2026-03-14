import type { Request, Response, NextFunction } from 'express';
import type { Role } from '../constants/index.js';
import { AppError } from '../errors/index.js';
import type { JwtPayload } from './auth.js';

/**
 * Returns middleware that only allows the specified roles.
 * Must be placed AFTER `authenticate`.
 */
export function authorize(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const user = (req as unknown as Record<string, unknown>)['user'] as JwtPayload | undefined;
    if (!user) {
      throw AppError.unauthorized();
    }
    if (!roles.includes(user.role as Role)) {
      throw AppError.forbidden('You do not have permission to access this resource');
    }
    next();
  };
}
