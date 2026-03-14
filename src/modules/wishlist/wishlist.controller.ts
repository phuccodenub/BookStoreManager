import type { Request, Response, NextFunction } from 'express';
import * as svc from './wishlist.service.js';
import { sendSuccess, sendCreated, sendNoContent, buildPaginationMeta, param } from '../../shared/http/index.js';

function uid(req: Request) { return ((req as unknown as Record<string, unknown>)['user'] as { userId: string }).userId; }

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const { page, limit } = req.query as unknown as { page: number; limit: number };
    const { items, total } = await svc.list(uid(req), page, limit);
    sendSuccess(res, items, buildPaginationMeta(page, limit, total));
  } catch (e) { next(e); }
}
export async function add(req: Request, res: Response, next: NextFunction) {
  try { sendCreated(res, await svc.add(uid(req), param(req, 'bookId'))); } catch (e) { next(e); }
}
export async function remove(req: Request, res: Response, next: NextFunction) {
  try { await svc.remove(uid(req), param(req, 'bookId')); sendNoContent(res); } catch (e) { next(e); }
}
