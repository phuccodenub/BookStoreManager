import { prisma } from '../../shared/prisma/index.js';
import type { Prisma } from '@prisma/client';

const bookCardSelect = {
  id: true,
  title: true,
  slug: true,
  coverImage: true,
  price: true,
  stockQuantity: true,
  soldQuantity: true,
  status: true,
  isFeatured: true,
  isNew: true,
  isBestSeller: true,
  author: { select: { id: true, name: true } },
  category: { select: { id: true, name: true, slug: true } },
  publisher: { select: { id: true, name: true } },
} satisfies Prisma.BookSelect;

export async function getHomeData(limit: number) {
  const now = new Date();

  const [banners, featuredBooks, newBooks, bestSellerBooks] = await Promise.all([
    prisma.banner.findMany({
      where: {
        status: true,
        OR: [{ startDate: null }, { startDate: { lte: now } }],
        AND: [{ OR: [{ endDate: null }, { endDate: { gte: now } }] }],
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      take: Math.min(limit, 10),
    }),
    prisma.book.findMany({
      where: { status: 'active', isFeatured: true },
      orderBy: [{ createdAt: 'desc' }, { soldQuantity: 'desc' }],
      take: limit,
      select: bookCardSelect,
    }),
    prisma.book.findMany({
      where: { status: 'active', isNew: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: bookCardSelect,
    }),
    prisma.book.findMany({
      where: { status: 'active', isBestSeller: true },
      orderBy: { soldQuantity: 'desc' },
      take: limit,
      select: bookCardSelect,
    }),
  ]);

  return {
    banners,
    featuredBooks,
    newBooks,
    bestSellerBooks,
  };
}
