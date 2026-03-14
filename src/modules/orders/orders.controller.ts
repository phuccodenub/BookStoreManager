import type { Request, Response, NextFunction } from 'express';
import * as svc from './orders.service.js';
import { transitionOrder } from '../fulfillment/fulfillment.service.js';
import { sendSuccess, sendCreated, buildPaginationMeta, param } from '../../shared/http/index.js';
import { log as logActivity } from '../activity-logs/activity-logs.service.js';

function uid(req: Request) { return ((req as unknown as Record<string, unknown>)['user'] as { userId: string }).userId; }

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const order = await svc.createOrder(uid(req), req.body);
    void logActivity({
      userId: uid(req),
      action: 'order_created',
      entityType: 'order',
      entityId: order.id,
      newData: { orderCode: order.orderCode, orderStatus: order.orderStatus, totalAmount: order.totalAmount },
      req,
    }).catch(() => undefined);
    sendCreated(res, order);
  } catch (e) { next(e); }
}
export async function listMine(req: Request, res: Response, next: NextFunction) {
  try {
    const q = req.query as unknown as { page: number; limit: number; status?: string };
    const { items, total, page, limit } = await svc.listMyOrders(uid(req), q);
    sendSuccess(res, items, buildPaginationMeta(page, limit, total));
  } catch (e) { next(e); }
}
export async function getMine(req: Request, res: Response, next: NextFunction) {
  try { sendSuccess(res, await svc.getMyOrder(uid(req), param(req, 'id'))); } catch (e) { next(e); }
}
export async function cancelMine(req: Request, res: Response, next: NextFunction) {
  try {
    const cancelled = await svc.cancelMyOrder(uid(req), param(req, 'id'), req.body.cancelledReason);
    void logActivity({
      userId: uid(req),
      action: 'order_cancelled',
      entityType: 'order',
      entityId: cancelled.id,
      newData: { orderCode: cancelled.orderCode, orderStatus: cancelled.orderStatus, cancelledReason: cancelled.cancelledReason },
      req,
    }).catch(() => undefined);
    sendSuccess(res, cancelled);
  } catch (e) { next(e); }
}

export async function listAll(req: Request, res: Response, next: NextFunction) {
  try {
    const q = req.query as unknown as { page: number; limit: number; status?: string; search?: string; userId?: string };
    const { items, total, page, limit } = await svc.listAll(q);
    sendSuccess(res, items, buildPaginationMeta(page, limit, total));
  } catch (e) { next(e); }
}
export async function getById(req: Request, res: Response, next: NextFunction) {
  try { sendSuccess(res, await svc.getOrderById(param(req, 'id'))); } catch (e) { next(e); }
}
export async function updateStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const id = param(req, 'id');
    const { previousOrder, updated } = await transitionOrder(id, req.body.orderStatus, uid(req), req.body.cancelledReason);
    void logActivity({
      userId: uid(req),
      action: 'order_status_updated',
      entityType: 'order',
      entityId: updated.id,
      oldData: { orderStatus: previousOrder.orderStatus, paymentStatus: previousOrder.paymentStatus },
      newData: { orderStatus: updated.orderStatus, paymentStatus: updated.paymentStatus },
      req,
    }).catch(() => undefined);
    sendSuccess(res, updated);
  } catch (e) { next(e); }
}
