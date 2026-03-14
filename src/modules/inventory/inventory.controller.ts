import type { Request, Response, NextFunction } from 'express';
import * as svc from './inventory.service.js';
import { sendSuccess, sendCreated, buildPaginationMeta } from '../../shared/http/index.js';
import { log as logActivity } from '../activity-logs/activity-logs.service.js';

function uid(req: Request) { return ((req as unknown as Record<string, unknown>)['user'] as { userId: string }).userId; }

async function createAndLog(req: Request, res: Response, next: NextFunction, payload: Parameters<typeof svc.createTransaction>[0], action: string) {
  try {
    const transaction = await svc.createTransaction(payload, uid(req));
    void logActivity({
      userId: uid(req),
      action,
      entityType: 'inventory_transaction',
      entityId: transaction.id,
      newData: payload,
      req,
    }).catch(() => undefined);
    sendCreated(res, transaction);
  } catch (e) { next(e); }
}

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const q = req.query as unknown as { page: number; limit: number; bookId?: string; type?: string };
    const { items, total, page, limit } = await svc.list(q);
    sendSuccess(res, items, buildPaginationMeta(page, limit, total));
  } catch (e) { next(e); }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  await createAndLog(req, res, next, req.body, `inventory_${req.body.type}_created`);
}

export async function importStock(req: Request, res: Response, next: NextFunction) {
  await createAndLog(req, res, next, { ...req.body, type: 'import' }, 'inventory_import_created');
}

export async function exportStock(req: Request, res: Response, next: NextFunction) {
  await createAndLog(req, res, next, { ...req.body, type: 'export', quantity: -Math.abs(req.body.quantity) }, 'inventory_export_created');
}

export async function adjustStock(req: Request, res: Response, next: NextFunction) {
  await createAndLog(req, res, next, { ...req.body, type: 'adjustment' }, 'inventory_adjustment_created');
}
