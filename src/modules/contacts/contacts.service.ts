import { prisma } from '../../shared/prisma/index.js';
import { AppError } from '../../shared/errors/index.js';
import type { Prisma } from '@prisma/client';

export async function list(query: { page: number; limit: number; status?: string; search?: string }) {
  const { page, limit, status, search } = query;
  const where: Prisma.ContactWhereInput = {};
  if (status) where.status = status as never;
  if (search) {
    where.OR = [
      { customerName: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { subject: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.contact.findMany({
      where, skip: (page - 1) * limit, take: limit,
      orderBy: { createdAt: 'desc' },
      include: { assignedStaff: { select: { id: true, fullName: true } } },
    }),
    prisma.contact.count({ where }),
  ]);
  return { items, total, page, limit };
}

export async function getById(id: string) {
  const c = await prisma.contact.findUnique({ where: { id }, include: { assignedStaff: { select: { id: true, fullName: true } } } });
  if (!c) throw AppError.notFound('Contact');
  return c;
}

export async function create(data: { customerName: string; email: string; phone?: string; subject: string; content: string }) {
  return prisma.contact.create({ data });
}

export async function update(id: string, data: { status?: string; assignedTo?: string | null; note?: string | null }) {
  await getById(id);
  return prisma.contact.update({ where: { id }, data: data as Prisma.ContactUpdateInput });
}

export async function remove(id: string) {
  await getById(id);
  await prisma.contact.delete({ where: { id } });
}
