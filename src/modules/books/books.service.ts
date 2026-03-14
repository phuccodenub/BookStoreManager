import { prisma } from '../../shared/prisma/index.js';
import { AppError } from '../../shared/errors/index.js';
import type { Prisma } from '@prisma/client';

const include = {
  category: { select: { id: true, name: true, slug: true } },
  author: { select: { id: true, name: true } },
  publisher: { select: { id: true, name: true } },
  images: { orderBy: { sortOrder: 'asc' as const } },
};

type ListQuery = {
  page: number; limit: number; search?: string;
  categoryId?: string; authorId?: string; publisherId?: string;
  status?: string; isFeatured?: boolean; isNew?: boolean; isBestSeller?: boolean;
  minPrice?: number; maxPrice?: number; sortBy?: string;
};

export async function list(q: ListQuery) {
  const where: Prisma.BookWhereInput = {};

  if (q.search) {
    where.OR = [
      { title: { contains: q.search, mode: 'insensitive' } },
      { isbn: { contains: q.search, mode: 'insensitive' } },
      { author: { name: { contains: q.search, mode: 'insensitive' } } },
    ];
  }
  if (q.categoryId) where.categoryId = q.categoryId;
  if (q.authorId) where.authorId = q.authorId;
  if (q.publisherId) where.publisherId = q.publisherId;
  if (q.status) where.status = q.status as never;
  if (q.isFeatured !== undefined) where.isFeatured = q.isFeatured;
  if (q.isNew !== undefined) where.isNew = q.isNew;
  if (q.isBestSeller !== undefined) where.isBestSeller = q.isBestSeller;
  if (q.minPrice !== undefined || q.maxPrice !== undefined) {
    where.price = {};
    if (q.minPrice !== undefined) where.price.gte = q.minPrice;
    if (q.maxPrice !== undefined) where.price.lte = q.maxPrice;
  }

  let orderBy: Prisma.BookOrderByWithRelationInput = { createdAt: 'desc' };
  switch (q.sortBy) {
    case 'price_asc':    orderBy = { price: 'asc' }; break;
    case 'price_desc':   orderBy = { price: 'desc' }; break;
    case 'newest':       orderBy = { createdAt: 'desc' }; break;
    case 'best_seller':  orderBy = { soldQuantity: 'desc' }; break;
  }

  const [items, total] = await Promise.all([
    prisma.book.findMany({ where, include, skip: (q.page - 1) * q.limit, take: q.limit, orderBy }),
    prisma.book.count({ where }),
  ]);
  return { items, total };
}

export async function getById(id: string) {
  const book = await prisma.book.findUnique({ where: { id }, include });
  if (!book) throw AppError.notFound('Book');
  return book;
}

export async function getBySlug(slug: string) {
  const book = await prisma.book.findUnique({ where: { slug }, include });
  if (!book) throw AppError.notFound('Book');
  return book;
}

export async function create(data: Record<string, unknown>) {
  return prisma.book.create({ data: data as never, include });
}

export async function update(id: string, data: Record<string, unknown>) {
  if (!(await prisma.book.findUnique({ where: { id } }))) throw AppError.notFound('Book');
  return prisma.book.update({ where: { id }, data: data as never, include });
}

export async function remove(id: string) {
  if (!(await prisma.book.findUnique({ where: { id } }))) throw AppError.notFound('Book');
  await prisma.book.delete({ where: { id } });
}

export async function updateCover(id: string, coverUrl: string) {
  if (!(await prisma.book.findUnique({ where: { id } }))) throw AppError.notFound('Book');
  return prisma.book.update({ where: { id }, data: { coverImage: coverUrl }, include });
}

export async function addImages(bookId: string, imageUrls: string[]) {
  if (!(await prisma.book.findUnique({ where: { id: bookId } }))) throw AppError.notFound('Book');
  const maxOrder = await prisma.bookImage.aggregate({ where: { bookId }, _max: { sortOrder: true } });
  let nextOrder = (maxOrder._max.sortOrder ?? -1) + 1;
  const images = await prisma.$transaction(
    imageUrls.map((url) => prisma.bookImage.create({ data: { bookId, imageUrl: url, sortOrder: nextOrder++ } })),
  );
  return images;
}

export async function removeImage(imageId: string) {
  if (!(await prisma.bookImage.findUnique({ where: { id: imageId } }))) throw AppError.notFound('BookImage');
  await prisma.bookImage.delete({ where: { id: imageId } });
}
