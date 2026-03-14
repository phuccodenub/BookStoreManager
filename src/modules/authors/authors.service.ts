import { prisma } from '../../shared/prisma/index.js';
import { AppError } from '../../shared/errors/index.js';
import type { Prisma } from '@prisma/client';

export async function list(q: { page: number; limit: number; search?: string }) {
  const where: Prisma.AuthorWhereInput = {};
  if (q.search) where.name = { contains: q.search, mode: 'insensitive' };
  const [items, total] = await Promise.all([
    prisma.author.findMany({ where, skip: (q.page - 1) * q.limit, take: q.limit, orderBy: { name: 'asc' } }),
    prisma.author.count({ where }),
  ]);
  return { items, total };
}

export async function getById(id: string) {
  const a = await prisma.author.findUnique({ where: { id }, include: { books: { select: { id: true, title: true, slug: true, coverImage: true, price: true } } } });
  if (!a) throw AppError.notFound('Author');
  return a;
}

export async function create(data: Record<string, unknown>) {
  return prisma.author.create({ data: data as never });
}

export async function update(id: string, data: Record<string, unknown>) {
  if (!(await prisma.author.findUnique({ where: { id } }))) throw AppError.notFound('Author');
  return prisma.author.update({ where: { id }, data: data as never });
}

export async function remove(id: string) {
  if (!(await prisma.author.findUnique({ where: { id } }))) throw AppError.notFound('Author');
  await prisma.author.delete({ where: { id } });
}

export async function updateAvatar(id: string, avatarUrl: string) {
  if (!(await prisma.author.findUnique({ where: { id } }))) throw AppError.notFound('Author');
  return prisma.author.update({ where: { id }, data: { avatar: avatarUrl } });
}
