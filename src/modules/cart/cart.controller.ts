import type { Request, Response, NextFunction } from 'express';
import * as svc from './cart.service.js';
import { sendSuccess, sendCreated, sendNoContent, param } from '../../shared/http/index.js';

function uid(req: Request) { return ((req as unknown as Record<string, unknown>)['user'] as { userId: string }).userId; }

export async function get(req: Request, res: Response, next: NextFunction) {
  try { sendSuccess(res, await svc.getCart(uid(req))); } catch (e) { next(e); }
}
export async function addItem(req: Request, res: Response, next: NextFunction) {
  try { sendCreated(res, await svc.addItem(uid(req), req.body.bookId, req.body.quantity)); } catch (e) { next(e); }
}
export async function updateItem(req: Request, res: Response, next: NextFunction) {
  try { sendSuccess(res, await svc.updateItem(uid(req), param(req, 'id'), req.body)); } catch (e) { next(e); }
}
export async function removeItem(req: Request, res: Response, next: NextFunction) {
  try { await svc.removeItem(uid(req), param(req, 'id')); sendNoContent(res); } catch (e) { next(e); }
}
