import { prisma } from '../../shared/prisma/index.js';
import type { Prisma } from '@prisma/client';
import type { Request } from 'express';

export async function list(query: { page: number; limit: number; userId?: string; entityId?: string; entityType?: string; action?: string }) {
  const { page, limit, userId, entityId, entityType, action } = query;
  const where: Prisma.ActivityLogWhereInput = {};
  if (userId) where.userId = userId;
  if (entityId) where.entityId = entityId;
  if (entityType) where.entityType = entityType;
  if (action) where.action = { contains: action, mode: 'insensitive' };

  const [items, total] = await Promise.all([
    prisma.activityLog.findMany({
      where, skip: (page - 1) * limit, take: limit,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { id: true, fullName: true, email: true } } },
    }),
    prisma.activityLog.count({ where }),
  ]);
  return { items, total, page, limit };
}

/** Utility to log an activity from anywhere in the application */
export async function log(params: {
  userId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  oldData?: unknown;
  newData?: unknown;
  req?: Request;
}) {
  const ip = params.req
    ? (params.req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ?? params.req.socket?.remoteAddress ?? null
    : null;

  return prisma.activityLog.create({
    data: {
      userId: params.userId ?? null,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId ?? null,
      oldData: params.oldData ? (params.oldData as Prisma.InputJsonValue) : undefined,
      newData: params.newData ? (params.newData as Prisma.InputJsonValue) : undefined,
      ipAddress: ip,
    },
  });
}
