import { prisma } from '../../shared/prisma/index.js';
import { AppError } from '../../shared/errors/index.js';
import { Role } from '../../shared/constants/index.js';
import type { Prisma } from '@prisma/client';

function isPrivilegedViewer(role?: string) {
  return role === Role.ADMIN || role === Role.STAFF;
}

export async function list(q: { page: number; limit: number; search?: string }, viewerRole?: string) {
  const privilegedViewer = isPrivilegedViewer(viewerRole);
  const where: Prisma.PublisherWhereInput = {};
  if (q.search) where.name = { contains: q.search, mode: 'insensitive' };
  if (!privilegedViewer) where.status = true;
  const [items, total] = await Promise.all([
    prisma.publisher.findMany({ where, skip: (q.page - 1) * q.limit, take: q.limit, orderBy: { name: 'asc' } }),
    prisma.publisher.count({ where }),
  ]);
  return { items, total };
}

export async function getById(id: string, viewerRole?: string) {
  const privilegedViewer = isPrivilegedViewer(viewerRole);
  const p = await prisma.publisher.findFirst({
    where: privilegedViewer ? { id } : { id, status: true },
    include: {
      books: {
        where: privilegedViewer ? undefined : { status: 'active' },
        select: { id: true, title: true, slug: true, price: true },
      },
    },
  });
  if (!p) throw AppError.notFound('Publisher');
  return p;
}

export async function create(data: Record<string, unknown>) {
  return prisma.publisher.create({ data: data as never });
}

export async function update(id: string, data: Record<string, unknown>) {
  if (!(await prisma.publisher.findUnique({ where: { id } }))) throw AppError.notFound('Publisher');
  return prisma.publisher.update({ where: { id }, data: data as never });
}

export async function remove(id: string) {
  if (!(await prisma.publisher.findUnique({ where: { id } }))) throw AppError.notFound('Publisher');
  await prisma.publisher.delete({ where: { id } });
}
