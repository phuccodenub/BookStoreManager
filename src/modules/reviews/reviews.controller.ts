import type { Request, Response, NextFunction } from 'express';
import * as svc from './reviews.service.js';
import { sendSuccess, sendCreated, buildPaginationMeta, param, sendNoContent } from '../../shared/http/index.js';
import { log as logActivity } from '../activity-logs/activity-logs.service.js';

function authUser(req: Request) {
  return ((req as unknown as Record<string, unknown>)['user'] as { userId: string; role: string });
}

export async function listByBook(req: Request, res: Response, next: NextFunction) {
  try {
    const { page, limit } = req.query as unknown as { page: number; limit: number };
    const { items, total } = await svc.listByBook(param(req, 'bookId'), page, limit);
    sendSuccess(res, items, buildPaginationMeta(page, limit, total));
  } catch (e) { next(e); }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try { sendCreated(res, await svc.create(authUser(req).userId, req.body)); } catch (e) { next(e); }
}

export async function createForBook(req: Request, res: Response, next: NextFunction) {
  try {
    sendCreated(res, await svc.create(authUser(req).userId, {
      ...req.body,
      bookId: param(req, 'bookId'),
    }));
  } catch (e) { next(e); }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const actor = authUser(req);
    const review = await svc.update(param(req, 'id'), actor, req.body);
    void logActivity({
      userId: actor.userId,
      action: 'review_updated',
      entityType: 'review',
      entityId: review.id,
      newData: req.body,
      req,
    }).catch(() => undefined);
    sendSuccess(res, review);
  } catch (e) { next(e); }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    const actor = authUser(req);
    await svc.remove(param(req, 'id'), actor);
    void logActivity({
      userId: actor.userId,
      action: 'review_deleted',
      entityType: 'review',
      entityId: param(req, 'id'),
      req,
    }).catch(() => undefined);
    sendNoContent(res);
  } catch (e) { next(e); }
}
