import { prisma } from '../../shared/prisma/index.js';
import { AppError } from '../../shared/errors/index.js';

export async function list(userId: string) {
  return prisma.address.findMany({ where: { userId }, orderBy: { isDefault: 'desc' } });
}

export async function create(userId: string, data: Record<string, unknown>) {
  if (data['isDefault']) {
    await prisma.address.updateMany({ where: { userId }, data: { isDefault: false } });
  }
  return prisma.address.create({ data: { ...data, userId } as never });
}

export async function update(userId: string, id: string, data: Record<string, unknown>) {
  const addr = await prisma.address.findFirst({ where: { id, userId } });
  if (!addr) throw AppError.notFound('Address');
  if (data['isDefault']) {
    await prisma.address.updateMany({ where: { userId, id: { not: id } }, data: { isDefault: false } });
  }
  return prisma.address.update({ where: { id }, data: data as never });
}

export async function remove(userId: string, id: string) {
  const addr = await prisma.address.findFirst({ where: { id, userId } });
  if (!addr) throw AppError.notFound('Address');
  await prisma.address.delete({ where: { id } });
}
