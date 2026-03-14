import { prisma } from '../../shared/prisma/index.js';
import { AppError } from '../../shared/errors/index.js';
import type { Prisma } from '@prisma/client';

export async function list(q: { page: number; limit: number; search?: string; parentId?: string }) {
  const where: Prisma.CategoryWhereInput = {};
  if (q.search) where.name = { contains: q.search, mode: 'insensitive' };
  if (q.parentId !== undefined) where.parentId = q.parentId || null;

  const [items, total] = await Promise.all([
    prisma.category.findMany({
      where,
      include: { children: { select: { id: true, name: true, slug: true } } },
      skip: (q.page - 1) * q.limit,
      take: q.limit,
      orderBy: { name: 'asc' },
    }),
    prisma.category.count({ where }),
  ]);
  return { items, total };
}

export async function getById(id: string) {
  const cat = await prisma.category.findUnique({
    where: { id },
    include: { children: true, parent: { select: { id: true, name: true, slug: true } } },
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
