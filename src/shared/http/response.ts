import type { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

/** Safely extract a single route param from Express 5 (string | string[]) */
export function param(req: Request, name: string): string {
  const v = req.params[name];
  return Array.isArray(v) ? v[0]! : v ?? '';
}

interface Meta {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
}

export function sendSuccess(
  res: Response,
  data: unknown = null,
  messageOrMeta?: string | Meta,
  statusCode: number = StatusCodes.OK,
  meta?: Meta,
): void {
  let message = 'Success';
  let paginationMeta = meta;
  if (typeof messageOrMeta === 'string') {
    message = messageOrMeta;
  } else if (messageOrMeta) {
    paginationMeta = messageOrMeta;
  }
  const body: Record<string, unknown> = {
    success: true,
    message,
    data,
  };
  if (paginationMeta) body['meta'] = paginationMeta;
  res.status(statusCode).json(body);
}

export function sendCreated(
  res: Response,
  data: unknown = null,
  message = 'Created',
): void {
  sendSuccess(res, data, message, StatusCodes.CREATED);
}

export function sendNoContent(res: Response): void {
  res.status(StatusCodes.NO_CONTENT).send();
}

export function buildPaginationMeta(
  page: number,
  limit: number,
  total: number,
): Meta {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
}
