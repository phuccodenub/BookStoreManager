import type { Request, Response, NextFunction } from 'express';
import * as svc from './activity-logs.service.js';
import { sendSuccess, buildPaginationMeta } from '../../shared/http/index.js';

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const q = req.query as unknown as { page: number; limit: number; userId?: string; entityId?: string; entityType?: string; action?: string };
    const { items, total, page, limit } = await svc.list(q);
    sendSuccess(res, items, buildPaginationMeta(page, limit, total));
  } catch (e) { next(e); }
}
