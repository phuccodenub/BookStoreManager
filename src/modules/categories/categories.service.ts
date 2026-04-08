import { prisma } from '../../shared/prisma/index.js';
import { AppError } from '../../shared/errors/index.js';
import { Role } from '../../shared/constants/index.js';
import type { Prisma } from '@prisma/client';

function isPrivilegedViewer(role?: string) {
  return role === Role.ADMIN || role === Role.STAFF;
}

export async function list(q: { page: number; limit: number; search?: string; parentId?: string }, viewerRole?: string) {
  const privilegedViewer = isPrivilegedViewer(viewerRole);
  const where: Prisma.CategoryWhereInput = {};
  if (q.search) where.name = { contains: q.search, mode: 'insensitive' };
  if (q.parentId !== undefined) where.parentId = q.parentId || null;
  if (!privilegedViewer) where.status = true;

  const [items, total] = await Promise.all([
    prisma.category.findMany({
      where,
      include: {
        children: {
          where: privilegedViewer ? undefined : { status: true },
          select: { id: true, name: true, slug: true },
        },
      },
      skip: (q.page - 1) * q.limit,
      take: q.limit,
      orderBy: { name: 'asc' },
    }),
    prisma.category.count({ where }),
  ]);
  return { items, total };
}

export async function getById(id: string, viewerRole?: string) {
  const privilegedViewer = isPrivilegedViewer(viewerRole);
  const cat = await prisma.category.findFirst({
    where: privilegedViewer ? { id } : { id, status: true },
    include: {
      children: {
        where: privilegedViewer ? undefined : { status: true },
      },
      parent: { select: { id: true, name: true, slug: true } },
    },
  });
  if (!cat) throw AppError.notFound('Category');
  return cat;
}

export async function create(data: Record<string, unknown>) {
  return prisma.category.create({ data: data as never });
}

export async function update(id: string, data: Record<string, unknown>) {
  const cat = await prisma.category.findUnique({ where: { id } });
  if (!cat) throw AppError.notFound('Category');
  return prisma.category.update({ where: { id }, data: data as never });
}

export async function remove(id: string) {
  const cat = await prisma.category.findUnique({ where: { id } });
  if (!cat) throw AppError.notFound('Category');
  await prisma.category.delete({ where: { id } });
}
