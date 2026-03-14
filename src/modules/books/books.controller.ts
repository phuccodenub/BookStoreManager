import type { Request, Response, NextFunction } from 'express';
import * as svc from './books.service.js';
import { sendSuccess, sendCreated, sendNoContent, buildPaginationMeta, param } from '../../shared/http/index.js';
import { fileUrl } from '../../shared/storage/index.js';

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const q = req.query as unknown as Parameters<typeof svc.list>[0];
    const { items, total } = await svc.list(q);
    sendSuccess(res, items, 'Success', 200, buildPaginationMeta(q.page, q.limit, total));
  } catch (e) { next(e); }
}

export async function getById(req: Request, res: Response, next: NextFunction) {
  try { sendSuccess(res, await svc.getById(param(req, 'id'))); } catch (e) { next(e); }
}

export async function related(req: Request, res: Response, next: NextFunction) {
  try {
    const { limit } = req.query as unknown as { limit: number };
    sendSuccess(res, await svc.listRelated(param(req, 'id'), limit));
  } catch (e) { next(e); }
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

export async function uploadCover(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.file) { res.status(400).json({ success: false, error: { code: 'NO_FILE', message: 'No file uploaded' } }); return; }
    sendSuccess(res, await svc.updateCover(param(req, 'id'), fileUrl(req.file.filename)));
  } catch (e) { next(e); }
}

export async function uploadImages(req: Request, res: Response, next: NextFunction) {
  try {
    const files = req.files as Express.Multer.File[] | undefined;
    if (!files?.length) { res.status(400).json({ success: false, error: { code: 'NO_FILE', message: 'No files uploaded' } }); return; }
    const urls = files.map((f) => fileUrl(f.filename));
    sendCreated(res, await svc.addImages(param(req, 'id'), urls));
  } catch (e) { next(e); }
}

export async function removeImage(req: Request, res: Response, next: NextFunction) {
  try { await svc.removeImage(param(req, 'imageId')); sendNoContent(res); } catch (e) { next(e); }
}
