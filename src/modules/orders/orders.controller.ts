import type { Request, Response, NextFunction } from 'express';
import * as svc from './orders.service.js';
import { transitionOrder } from '../fulfillment/fulfillment.service.js';
import { sendSuccess, sendCreated, buildPaginationMeta, param } from '../../shared/http/index.js';
import { log as logActivity } from '../activity-logs/activity-logs.service.js';
import { renderOrderPdf } from './orders.documents.js';

function uid(req: Request) { return ((req as unknown as Record<string, unknown>)['user'] as { userId: string }).userId; }

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const order = await svc.createOrder(uid(req), req.body);
    void logActivity({
      userId: uid(req),
      action: 'order_created',
      entityType: 'order',
      entityId: order.id,
      newData: { orderCode: order.orderCode, orderStatus: order.orderStatus, totalAmount: order.totalAmount, salesChannel: order.salesChannel },
      req,
    }).catch(() => undefined);
    sendCreated(res, order);
  } catch (e) { next(e); }
}

export async function createManual(req: Request, res: Response, next: NextFunction) {
  try {
    const order = await svc.createManualOrder(uid(req), req.body);
    void logActivity({
      userId: uid(req),
      action: 'order_created',
      entityType: 'order',
      entityId: order.id,
      newData: {
        orderCode: order.orderCode,
        orderStatus: order.orderStatus,
        totalAmount: order.totalAmount,
        salesChannel: order.salesChannel,
      },
      req,
    }).catch(() => undefined);

    if (req.body.internalNote) {
      void logActivity({
        userId: uid(req),
        action: 'order_internal_note_added',
        entityType: 'order',
        entityId: order.id,
        newData: { note: req.body.internalNote },
        req,
      }).catch(() => undefined);
    }

    if (req.body.trackingCode) {
      void logActivity({
        userId: uid(req),
        action: 'order_tracking_updated',
        entityType: 'order',
        entityId: order.id,
        newData: { trackingCode: req.body.trackingCode },
        req,
      }).catch(() => undefined);
    }

    sendCreated(res, order);
  } catch (e) { next(e); }
}
export async function listMine(req: Request, res: Response, next: NextFunction) {
  try {
    const q = req.query as unknown as Parameters<typeof svc.listMyOrders>[1];
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
    const q = req.query as unknown as Parameters<typeof svc.listAll>[0];
    const { items, total, page, limit } = await svc.listAll(q);
    sendSuccess(res, items, buildPaginationMeta(page, limit, total));
  } catch (e) { next(e); }
}
export async function getById(req: Request, res: Response, next: NextFunction) {
  try { sendSuccess(res, await svc.getOrderById(param(req, 'id'))); } catch (e) { next(e); }
}

async function sendOrderDocument(
  res: Response,
  kind: 'invoice' | 'delivery-note',
  orderId: string,
) {
  const order = await svc.getOrderById(orderId);
  const pdf = await renderOrderPdf(order, kind);
  const filePrefix = kind === 'invoice' ? 'invoice' : 'delivery-note';

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Length', pdf.length.toString());
  res.setHeader('Content-Disposition', `attachment; filename="${filePrefix}-${order.orderCode}.pdf"`);
  res.status(200).send(pdf);
}

export async function downloadInvoice(req: Request, res: Response, next: NextFunction) {
  try { await sendOrderDocument(res, 'invoice', param(req, 'id')); } catch (e) { next(e); }
}

export async function downloadDeliveryNote(req: Request, res: Response, next: NextFunction) {
  try { await sendOrderDocument(res, 'delivery-note', param(req, 'id')); } catch (e) { next(e); }
}

export async function updateOps(req: Request, res: Response, next: NextFunction) {
  try {
    const id = param(req, 'id');
    const order = await svc.getOrderById(id);

    if (req.body.trackingCode) {
      await logActivity({
        userId: uid(req),
        action: 'order_tracking_updated',
        entityType: 'order',
        entityId: id,
        newData: { trackingCode: req.body.trackingCode.trim(), orderCode: order.orderCode },
        req,
      });
    }

    if (req.body.internalNote) {
      await logActivity({
        userId: uid(req),
        action: 'order_internal_note_added',
        entityType: 'order',
        entityId: id,
        newData: { note: req.body.internalNote.trim(), orderCode: order.orderCode },
        req,
      });
    }

    sendSuccess(res, await svc.getOrderById(id));
  } catch (e) { next(e); }
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
