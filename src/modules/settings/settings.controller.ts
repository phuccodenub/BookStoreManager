import type { Request, Response, NextFunction } from 'express';
import * as svc from './settings.service.js';
import { sendSuccess } from '../../shared/http/index.js';
import { log as logActivity } from '../activity-logs/activity-logs.service.js';

function authUser(req: Request) {
  return ((req as unknown as Record<string, unknown>)['user'] as { userId: string });
}

export async function getPublic(req: Request, res: Response, next: NextFunction) {
  try {
    sendSuccess(res, await svc.getPublicSettings());
  } catch (e) { next(e); }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const settings = await svc.updateSettings(req.body);
    void logActivity({
      userId: authUser(req).userId,
      action: 'settings_updated',
      entityType: 'system_config',
      entityId: settings.id,
      newData: req.body,
      req,
    }).catch(() => undefined);
    sendSuccess(res, settings);
  } catch (e) { next(e); }
}
