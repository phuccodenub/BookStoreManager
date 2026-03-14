import bcrypt from 'bcryptjs';
import { prisma } from '../../shared/prisma/index.js';
import { AppError } from '../../shared/errors/index.js';
import type { Prisma } from '@prisma/client';

const safeSelect = {
  id: true,
  fullName: true,
  email: true,
  phone: true,
  avatar: true,
  role: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} as const;

export async function getProfile(userId: string) {
  return prisma.user.findUniqueOrThrow({ where: { id: userId }, select: safeSelect });
}

export async function updateProfile(userId: string, data: { fullName?: string; phone?: string }) {
  return prisma.user.update({ where: { id: userId }, data, select: safeSelect });
}

export async function updateAvatar(userId: string, avatarUrl: string) {
  return prisma.user.update({ where: { id: userId }, data: { avatar: avatarUrl }, select: safeSelect });
}

export async function listUsers(query: { page: number; limit: number; search?: string; role?: string; status?: string }) {
  const where: Prisma.UserWhereInput = {};
  if (query.role) where.role = query.role as never;
  if (query.status) where.status = query.status as never;
  if (query.search) {
    where.OR = [
      { fullName: { contains: query.search, mode: 'insensitive' } },
      { email: { contains: query.search, mode: 'insensitive' } },
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: safeSelect,
      skip: (query.page - 1) * query.limit,
      take: query.limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.count({ where }),
  ]);

  return { users, total };
}

export async function getUserById(id: string) {
  const user = await prisma.user.findUnique({ where: { id }, select: safeSelect });
  if (!user) throw AppError.notFound('User');
  return user;
}

export async function adminCreateUser(data: { fullName: string; email: string; phone?: string; password: string; role: string }) {
  const email = data.email.toLowerCase();
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) throw AppError.conflict('Email already registered');

  const passwordHash = await bcrypt.hash(data.password, 10);
  return prisma.user.create({
    data: {
      fullName: data.fullName,
      email,
      phone: data.phone,
      passwordHash,
      role: data.role as never,
    },
    select: safeSelect,
  });
}

export async function adminUpdateUser(id: string, data: { fullName?: string; phone?: string; role?: string }) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw AppError.notFound('User');
  return prisma.user.update({
    where: { id },
    data: {
      ...(data.fullName && { fullName: data.fullName }),
      ...(data.phone !== undefined && { phone: data.phone }),
      ...(data.role && { role: data.role as never }),
    },
    select: safeSelect,
  });
}

export async function updateUserStatus(id: string, status: string) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw AppError.notFound('User');
  return prisma.user.update({ where: { id }, data: { status: status as never }, select: safeSelect });
}

export async function deleteUser(id: string) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw AppError.notFound('User');
  await prisma.user.delete({ where: { id } });
}
