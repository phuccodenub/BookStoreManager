import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/index.js';
import { AppError } from '../errors/index.js';
import { prisma } from '../prisma/index.js';

export interface JwtPayload {
  userId: string;
  role: string;
}

export async function resolveAuthenticatedUser(token: string): Promise<JwtPayload> {
  let payload: JwtPayload;

  try {
    payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload;
  } catch {
    throw AppError.unauthorized('Invalid or expired access token');
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, role: true, status: true },
  });

  if (!user) {
    throw AppError.unauthorized('User no longer exists');
  }

  if (user.status !== 'active') {
    throw AppError.forbidden('Account is locked');
  }

  return { userId: user.id, role: user.role };
}

export async function authenticate(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    throw AppError.unauthorized('Missing or invalid Authorization header');
  }

  const token = header.slice(7);
  const user = await resolveAuthenticatedUser(token);
  (req as unknown as Record<string, unknown>)['user'] = user;
  next();
}

export async function optionalAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    next();
    return;
  }

  const token = header.slice(7);
  try {
    const user = await resolveAuthenticatedUser(token);
    (req as unknown as Record<string, unknown>)['user'] = user;
  } catch (error) {
    if (error instanceof AppError && [401, 403].includes(error.statusCode)) {
      next();
      return;
    }
    throw error;
  }
  next();
}
