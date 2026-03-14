import type { Request, Response, NextFunction } from 'express';
import * as svc from './home.service.js';
import { sendSuccess } from '../../shared/http/index.js';

export async function getHome(req: Request, res: Response, next: NextFunction) {
  try {
    const { limit } = req.query as unknown as { limit: number };
    sendSuccess(res, await svc.getHomeData(limit));
  } catch (e) { next(e); }
}
