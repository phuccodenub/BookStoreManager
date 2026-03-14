import type { Request, Response, NextFunction } from 'express';
import * as svc from './users.service.js';
import { sendSuccess, sendCreated, sendNoContent, buildPaginationMeta, param } from '../../shared/http/index.js';
import { fileUrl } from '../../shared/storage/index.js';
import { log as logActivity } from '../activity-logs/activity-logs.service.js';

function userId(req: Request): string {
  return ((req as unknown as Record<string, unknown>)['user'] as { userId: string }).userId;
}

/* ── My profile ── */
export async function getMe(req: Request, res: Response, next: NextFunction) {
  try { sendSuccess(res, await svc.getProfile(userId(req))); } catch (e) { next(e); }
}

export async function updateMe(req: Request, res: Response, next: NextFunction) {
  try { sendSuccess(res, await svc.updateProfile(userId(req), req.body)); } catch (e) { next(e); }
}

export async function uploadAvatar(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.file) { res.status(400).json({ success: false, error: { code: 'NO_FILE', message: 'No file uploaded' } }); return; }
    const url = fileUrl(req.file.filename);
    sendSuccess(res, await svc.updateAvatar(userId(req), url));
  } catch (e) { next(e); }
}

/* ── Admin ── */
export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const q = req.query as unknown as { page: number; limit: number; search?: string; role?: string; status?: string };
    const { users, total } = await svc.listUsers(q);
    sendSuccess(res, users, 'Success', 200, buildPaginationMeta(q.page, q.limit, total));
  } catch (e) { next(e); }
}

export async function getById(req: Request, res: Response, next: NextFunction) {
  try { sendSuccess(res, await svc.getUserById(param(req, 'id'))); } catch (e) { next(e); }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const created = await svc.adminCreateUser(req.body);
    void logActivity({
      userId: userId(req),
      action: 'user_created',
      entityType: 'user',
      entityId: created.id,
      newData: { role: created.role, status: created.status },
      req,
    }).catch(() => undefined);
    sendCreated(res, created);
  } catch (e) { next(e); }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const id = param(req, 'id');
    const before = await svc.getUserById(id);
    const updated = await svc.adminUpdateUser(id, req.body);
    void logActivity({
      userId: userId(req),
      action: 'user_updated',
      entityType: 'user',
      entityId: updated.id,
      oldData: { role: before.role, fullName: before.fullName, phone: before.phone },
      newData: { role: updated.role, fullName: updated.fullName, phone: updated.phone },
      req,
    }).catch(() => undefined);
    sendSuccess(res, updated);
  } catch (e) { next(e); }
}

export async function updateStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const id = param(req, 'id');
    const before = await svc.getUserById(id);
    const updated = await svc.updateUserStatus(id, req.body.status);
    void logActivity({
      userId: userId(req),
      action: 'user_status_updated',
      entityType: 'user',
      entityId: updated.id,
      oldData: { status: before.status },
      newData: { status: updated.status },
      req,
    }).catch(() => undefined);
    sendSuccess(res, updated);
  } catch (e) { next(e); }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try { await svc.deleteUser(param(req, 'id')); sendNoContent(res); } catch (e) { next(e); }
}
