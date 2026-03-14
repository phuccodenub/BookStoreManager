import { prisma } from '../../shared/prisma/index.js';
import { env } from '../../shared/config/index.js';
import type { Prisma } from '@prisma/client';

/** Admin dashboard overview */
export async function dashboard() {
  const [
    totalUsers, totalBooks, totalOrders,
    pendingOrders, completedOrders, cancelledOrders,
    totalRevenue, lowStockCount,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.book.count(),
    prisma.order.count(),
    prisma.order.count({ where: { orderStatus: 'pending' } }),
    prisma.order.count({ where: { orderStatus: 'completed' } }),
    prisma.order.count({ where: { orderStatus: 'cancelled' } }),
    prisma.order.aggregate({ where: { orderStatus: 'completed' }, _sum: { totalAmount: true } }),
    prisma.book.count({ where: { stockQuantity: { lte: env.LOW_STOCK_THRESHOLD } } }),
  ]);

  return {
    totalUsers,
    totalBooks,
    totalOrders,
    pendingOrders,
    completedOrders,
    cancelledOrders,
    totalRevenue: Number(totalRevenue._sum.totalAmount ?? 0),
    lowStockCount,
  };
}

/** Revenue grouped by month */
export async function revenueByTime(from?: Date, to?: Date) {
  const where: Record<string, unknown> = { orderStatus: 'completed' };
  if (from || to) {
    where['createdAt'] = {};
    if (from) (where['createdAt'] as Record<string, unknown>)['gte'] = from;
    if (to) (where['createdAt'] as Record<string, unknown>)['lte'] = to;
  }

  const orders = await prisma.order.findMany({
    where: where as never,
    select: { createdAt: true, totalAmount: true },
    orderBy: { createdAt: 'asc' },
  });

  const map = new Map<string, number>();
  for (const o of orders) {
    const key = `${o.createdAt.getFullYear()}-${String(o.createdAt.getMonth() + 1).padStart(2, '0')}`;
    map.set(key, (map.get(key) ?? 0) + Number(o.totalAmount));
  }
  return Array.from(map.entries()).map(([month, revenue]) => ({ month, revenue }));
}

/** Best-selling books */
export async function bestSellers(limit: number, from?: Date, to?: Date) {
  const where: Record<string, unknown> = {};
  if (from || to) {
    where['createdAt'] = {};
    if (from) (where['createdAt'] as Record<string, unknown>)['gte'] = from;
    if (to) (where['createdAt'] as Record<string, unknown>)['lte'] = to;
  }

  // Use orderItem aggregation
  const result = await prisma.orderItem.groupBy({
    by: ['bookId'],
    where: {
      order: { orderStatus: 'completed', ...((where as Record<string, unknown>) as Prisma.OrderWhereInput) },
    },
    _sum: { quantity: true, totalPrice: true },
    orderBy: { _sum: { quantity: 'desc' } },
    take: limit,
  });

  const bookIds = result.map(r => r.bookId);
  const books = await prisma.book.findMany({
    where: { id: { in: bookIds } },
    select: { id: true, title: true, slug: true, coverImage: true, price: true },
  });
  const bookMap = new Map(books.map(b => [b.id, b]));

  return result.map(r => ({
    book: bookMap.get(r.bookId),
    totalSold: r._sum.quantity,
    totalRevenue: Number(r._sum.totalPrice ?? 0),
  }));
}

/** Low-stock / inventory report */
export async function inventoryReport() {
  return prisma.book.findMany({
    where: { status: 'active' },
    select: { id: true, title: true, slug: true, stockQuantity: true, soldQuantity: true, price: true, importPrice: true },
    orderBy: { stockQuantity: 'asc' },
  });
}

/** Cancelled orders report */
export async function cancelledOrders(from?: Date, to?: Date) {
  const where: Record<string, unknown> = { orderStatus: 'cancelled' };
  if (from || to) {
    where['createdAt'] = {};
    if (from) (where['createdAt'] as Record<string, unknown>)['gte'] = from;
    if (to) (where['createdAt'] as Record<string, unknown>)['lte'] = to;
  }

  return prisma.order.findMany({
    where: where as never,
    select: {
      id: true, orderCode: true, totalAmount: true, cancelledReason: true, createdAt: true,
      user: { select: { id: true, fullName: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
}

/** Top customers by spending */
export async function topCustomers(limit: number, from?: Date, to?: Date) {
  const where: Record<string, unknown> = { orderStatus: 'completed' };
  if (from || to) {
    where['createdAt'] = {};
    if (from) (where['createdAt'] as Record<string, unknown>)['gte'] = from;
    if (to) (where['createdAt'] as Record<string, unknown>)['lte'] = to;
  }

  const result = await prisma.order.groupBy({
    by: ['userId'],
    where: where as never,
    _sum: { totalAmount: true },
    _count: true,
    orderBy: { _sum: { totalAmount: 'desc' } },
    take: limit,
  });

  const userIds = result.map(r => r.userId);
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, fullName: true, email: true, phone: true },
  });
  const userMap = new Map(users.map(u => [u.id, u]));

  return result.map(r => ({
    user: userMap.get(r.userId),
    orderCount: r._count,
    totalSpent: Number(r._sum.totalAmount ?? 0),
  }));
}
