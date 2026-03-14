import type { Request, Response, NextFunction } from 'express';
import * as svc from './addresses.service.js';
import { sendSuccess, sendCreated, sendNoContent, param } from '../../shared/http/index.js';

function userId(req: Request) {
  return ((req as unknown as Record<string, unknown>)['user'] as { userId: string }).userId;
}

export async function list(req: Request, res: Response, next: NextFunction) {
  try { sendSuccess(res, await svc.list(userId(req))); } catch (e) { next(e); }
}
export async function create(req: Request, res: Response, next: NextFunction) {
  try { sendCreated(res, await svc.create(userId(req), req.body)); } catch (e) { next(e); }
}
export async function update(req: Request, res: Response, next: NextFunction) {
  try { sendSuccess(res, await svc.update(userId(req), param(req, 'id'), req.body)); } catch (e) { next(e); }
}
export async function remove(req: Request, res: Response, next: NextFunction) {
  try { await svc.remove(userId(req), param(req, 'id')); sendNoContent(res); } catch (e) { next(e); }
}
