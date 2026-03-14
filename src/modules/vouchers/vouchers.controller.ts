import type { Request, Response, NextFunction } from 'express';
import * as svc from './vouchers.service.js';
import { sendSuccess, sendCreated, sendNoContent, buildPaginationMeta, param } from '../../shared/http/index.js';

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const q = req.query as unknown as { page: number; limit: number; search?: string; status?: string };
    const { items, total, page, limit } = await svc.list(q);
    sendSuccess(res, items, buildPaginationMeta(page, limit, total));
  } catch (e) { next(e); }
}

export async function getById(req: Request, res: Response, next: NextFunction) {
  try { sendSuccess(res, await svc.getById(param(req, 'id'))); } catch (e) { next(e); }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try { sendCreated(res, await svc.create(req.body)); } catch (e) { next(e); }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try { sendSuccess(res, await svc.update(param(req, 'id'), req.body)); } catch (e) { next(e); }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try { await svc.remove(param(req, 'id')); sendNoContent(res); } catch (e) { next(e); }
}

export async function validate(req: Request, res: Response, next: NextFunction) {
  try { sendSuccess(res, await svc.validateVoucher(req.body.code, req.body.orderSubtotal)); } catch (e) { next(e); }
}
