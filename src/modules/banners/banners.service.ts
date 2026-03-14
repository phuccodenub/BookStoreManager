import { prisma } from '../../shared/prisma/index.js';
import { AppError } from '../../shared/errors/index.js';

export async function list() {
  return prisma.banner.findMany({ orderBy: { sortOrder: 'asc' } });
}

export async function listActive() {
  const now = new Date();
  return prisma.banner.findMany({
    where: {
      status: true,
      OR: [
        { startDate: null },
        { startDate: { lte: now } },
      ],
      AND: [
        { OR: [{ endDate: null }, { endDate: { gte: now } }] },
      ],
    },
    orderBy: { sortOrder: 'asc' },
  });
}

export async function create(data: Record<string, unknown>, imageUrl: string) {
  return prisma.banner.create({ data: { ...data, image: imageUrl } as never });
}

export async function update(id: string, data: Record<string, unknown>) {
  if (!(await prisma.banner.findUnique({ where: { id } }))) throw AppError.notFound('Banner');
  return prisma.banner.update({ where: { id }, data: data as never });
}

export async function remove(id: string) {
  if (!(await prisma.banner.findUnique({ where: { id } }))) throw AppError.notFound('Banner');
  await prisma.banner.delete({ where: { id } });
}
