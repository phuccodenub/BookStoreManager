import type { Request, Response, NextFunction } from 'express';
import * as svc from './banners.service.js';
import { sendSuccess, sendCreated, sendNoContent, param } from '../../shared/http/index.js';
import { fileUrl } from '../../shared/storage/index.js';

export async function listPublic(_req: Request, res: Response, next: NextFunction) {
  try { sendSuccess(res, await svc.listActive()); } catch (e) { next(e); }
}
export async function listAll(_req: Request, res: Response, next: NextFunction) {
  try { sendSuccess(res, await svc.list()); } catch (e) { next(e); }
}
export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.file) { res.status(400).json({ success: false, error: { code: 'NO_FILE', message: 'Banner image required' } }); return; }
    sendCreated(res, await svc.create(req.body, fileUrl(req.file.filename)));
  } catch (e) { next(e); }
}
export async function update(req: Request, res: Response, next: NextFunction) {
  try { sendSuccess(res, await svc.update(param(req, 'id'), req.body)); } catch (e) { next(e); }
}
export async function remove(req: Request, res: Response, next: NextFunction) {
  try { await svc.remove(param(req, 'id')); sendNoContent(res); } catch (e) { next(e); }
}
