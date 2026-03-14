import type { Request, Response, NextFunction } from 'express';
import * as svc from './reviews.service.js';
import { sendSuccess, sendCreated, buildPaginationMeta, param } from '../../shared/http/index.js';

function uid(req: Request) { return ((req as unknown as Record<string, unknown>)['user'] as { userId: string }).userId; }

export async function listByBook(req: Request, res: Response, next: NextFunction) {
  try {
    const { page, limit } = req.query as unknown as { page: number; limit: number };
    const { items, total } = await svc.listByBook(param(req, 'bookId'), page, limit);
    sendSuccess(res, items, buildPaginationMeta(page, limit, total));
  } catch (e) { next(e); }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try { sendCreated(res, await svc.create(uid(req), req.body)); } catch (e) { next(e); }
}
