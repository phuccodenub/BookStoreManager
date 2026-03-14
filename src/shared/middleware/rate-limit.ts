import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/index.js';

interface RateLimitOptions {
  windowMs: number;
  max: number;
  message?: string;
  keyGenerator?: (req: Request) => string;
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

function getClientKey(req: Request): string {
  return req.ip || req.socket.remoteAddress || 'unknown';
}

export function rateLimit(options: RateLimitOptions) {
  const store = new Map<string, RateLimitEntry>();
  let lastCleanup = 0;

  return (req: Request, _res: Response, next: NextFunction): void => {
    const now = Date.now();
    if (now - lastCleanup > options.windowMs) {
      for (const [key, entry] of store.entries()) {
        if (entry.resetAt <= now) {
          store.delete(key);
        }
      }
      lastCleanup = now;
    }

    const key = options.keyGenerator ? options.keyGenerator(req) : getClientKey(req);
    const current = store.get(key);

    if (!current || current.resetAt <= now) {
      store.set(key, { count: 1, resetAt: now + options.windowMs });
      next();
      return;
    }

    current.count += 1;
    if (current.count > options.max) {
      next(AppError.tooManyRequests(options.message ?? 'Too many requests'));
      return;
    }

    next();
  };
}
