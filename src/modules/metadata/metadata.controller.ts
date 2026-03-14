import type { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../../shared/http/index.js';
import { getEnums } from './metadata.service.js';

export async function enums(_req: Request, res: Response, next: NextFunction) {
  try {
    sendSuccess(res, getEnums());
  } catch (e) { next(e); }
}
