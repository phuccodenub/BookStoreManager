import { prisma } from '../../shared/prisma/index.js';
import { AppError } from '../../shared/errors/index.js';
import type { Prisma } from '@prisma/client';

export async function list(userId: string, page: number, limit: number) {
  const skip = (page - 1) * limit;
  const where: Prisma.WishlistWhereInput = { userId };
  const [items, total] = await Promise.all([
    prisma.wishlist.findMany({
      where,
      skip,
      take: limit,
      include: {
        book: { select: { id: true, title: true, slug: true, coverImage: true, price: true, status: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.wishlist.count({ where }),
  ]);
  return { items, total, page, limit };
}

export async function add(userId: string, bookId: string) {
  const book = await prisma.book.findUnique({ where: { id: bookId } });
  if (!book) throw AppError.notFound('Book');
  const existing = await prisma.wishlist.findUnique({ where: { userId_bookId: { userId, bookId } } });
  if (existing) return existing;
  return prisma.wishlist.create({ data: { userId, bookId } });
}

export async function remove(userId: string, bookId: string) {
  const existing = await prisma.wishlist.findUnique({ where: { userId_bookId: { userId, bookId } } });
  if (!existing) throw AppError.notFound('Wishlist item');
  await prisma.wishlist.delete({ where: { id: existing.id } });
}
