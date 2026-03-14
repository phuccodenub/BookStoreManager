import type { Request, Response, NextFunction } from 'express';
import * as svc from './payments.service.js';
import { sendSuccess } from '../../shared/http/index.js';
import { env } from '../../shared/config/index.js';
import { AppError } from '../../shared/errors/index.js';
import { log as logActivity } from '../activity-logs/activity-logs.service.js';

export async function webhook(req: Request, res: Response, next: NextFunction) {
  try {
    const providedSecret = req.headers['x-webhook-secret'];
    const secret = Array.isArray(providedSecret) ? providedSecret[0] : providedSecret;
    if (!env.PAYMENT_WEBHOOK_SECRET || secret !== env.PAYMENT_WEBHOOK_SECRET) {
      throw AppError.unauthorized('Invalid webhook secret');
    }

    const result = await svc.handleWebhook(req.body);
    void logActivity({
      action: 'payment_webhook_processed',
      entityType: 'payment',
      entityId: result.orderId,
      newData: { orderId: result.orderId, paymentStatus: result.paymentStatus },
      req,
    }).catch(() => undefined);
    sendSuccess(res, result);
  } catch (e) { next(e); }
}
