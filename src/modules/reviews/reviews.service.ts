import { prisma } from '../../shared/prisma/index.js';
import { AppError } from '../../shared/errors/index.js';
import { Role } from '../../shared/constants/index.js';

export async function listByBook(bookId: string, page: number, limit: number) {
  const where = { bookId };
  const [items, total] = await Promise.all([
    prisma.review.findMany({
      where, skip: (page - 1) * limit, take: limit,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { id: true, fullName: true, avatar: true } } },
    }),
    prisma.review.count({ where }),
  ]);
  return { items, total, page, limit };
}

export async function create(userId: string, data: { bookId: string; orderId: string; rating: number; comment?: string }) {
  const order = await prisma.order.findFirst({
    where: { id: data.orderId, userId, orderStatus: 'completed' },
    include: { items: true },
  });
  if (!order) throw AppError.badRequest('Can only review books from completed orders');

  const hasBook = order.items.some(i => i.bookId === data.bookId);
  if (!hasBook) throw AppError.badRequest('Book is not part of this order');

  const exists = await prisma.review.findUnique({
    where: { userId_bookId_orderId: { userId, bookId: data.bookId, orderId: data.orderId } },
  });
  if (exists) throw AppError.conflict('Already reviewed this book for this order');

  return prisma.review.create({
    data: { userId, bookId: data.bookId, orderId: data.orderId, rating: data.rating, comment: data.comment ?? null },
  });
}

export async function update(reviewId: string, actor: { userId: string; role: string }, data: { rating?: number; comment?: string }) {
  const review = await prisma.review.findUnique({ where: { id: reviewId } });
  if (!review) throw AppError.notFound('Review');

  const canManageAnyReview = actor.role === Role.ADMIN;
  if (!canManageAnyReview && review.userId !== actor.userId) {
    throw AppError.forbidden('Cannot update this review');
  }

  return prisma.review.update({
    where: { id: reviewId },
    data: {
      ...(data.rating !== undefined ? { rating: data.rating } : {}),
      ...(data.comment !== undefined ? { comment: data.comment } : {}),
    },
  });
}

export async function remove(reviewId: string, actor: { userId: string; role: string }) {
  const review = await prisma.review.findUnique({ where: { id: reviewId } });
  if (!review) throw AppError.notFound('Review');

  const canManageAnyReview = actor.role === Role.ADMIN;
  if (!canManageAnyReview && review.userId !== actor.userId) {
    throw AppError.forbidden('Cannot delete this review');
  }

  await prisma.review.delete({ where: { id: reviewId } });
}
