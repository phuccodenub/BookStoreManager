import type { Request, Response, NextFunction } from 'express';
import * as svc from './inventory.service.js';
import { sendSuccess, sendCreated, buildPaginationMeta, param } from '../../shared/http/index.js';

function uid(req: Request) { return ((req as unknown as Record<string, unknown>)['user'] as { userId: string }).userId; }

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const q = req.query as unknown as { page: number; limit: number; bookId?: string; type?: string };
    const { items, total, page, limit } = await svc.list(q);
    sendSuccess(res, items, buildPaginationMeta(page, limit, total));
  } catch (e) { next(e); }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try { sendCreated(res, await svc.createTransaction(req.body, uid(req))); } catch (e) { next(e); }
}
