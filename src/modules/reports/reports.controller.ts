import type { Request, Response, NextFunction } from 'express';
import * as svc from './reports.service.js';
import { sendSuccess } from '../../shared/http/index.js';

export async function dashboard(_req: Request, res: Response, next: NextFunction) {
  try { sendSuccess(res, await svc.dashboard()); } catch (e) { next(e); }
}

export async function revenue(req: Request, res: Response, next: NextFunction) {
  try {
    const { from, to } = req.query as unknown as { from?: Date; to?: Date };
    sendSuccess(res, await svc.revenueByTime(from, to));
  } catch (e) { next(e); }
}

export async function bestSellers(req: Request, res: Response, next: NextFunction) {
  try {
    const { limit, from, to } = req.query as unknown as { limit: number; from?: Date; to?: Date };
    sendSuccess(res, await svc.bestSellers(limit, from, to));
  } catch (e) { next(e); }
}

export async function inventory(_req: Request, res: Response, next: NextFunction) {
  try { sendSuccess(res, await svc.inventoryReport()); } catch (e) { next(e); }
}

export async function cancelled(req: Request, res: Response, next: NextFunction) {
  try {
    const { from, to } = req.query as unknown as { from?: Date; to?: Date };
    sendSuccess(res, await svc.cancelledOrders(from, to));
  } catch (e) { next(e); }
}

export async function topCustomers(req: Request, res: Response, next: NextFunction) {
  try {
    const { limit, from, to } = req.query as unknown as { limit: number; from?: Date; to?: Date };
    sendSuccess(res, await svc.topCustomers(limit, from, to));
  } catch (e) { next(e); }
}
