import { prisma } from '../../shared/prisma/index.js';
import { AppError } from '../../shared/errors/index.js';
import type { Prisma } from '@prisma/client';
import { env } from '../../shared/config/index.js';
import { getIO } from '../../shared/socket/index.js';

export async function list(query: { page: number; limit: number; bookId?: string; type?: string }) {
  const { page, limit, bookId, type } = query;
  const where: Prisma.InventoryTransactionWhereInput = {};
  if (bookId) where.bookId = bookId;
  if (type) where.type = type as never;

  const [items, total] = await Promise.all([
    prisma.inventoryTransaction.findMany({
      where, skip: (page - 1) * limit, take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        book: { select: { id: true, title: true, slug: true } },
        creator: { select: { id: true, fullName: true } },
      },
    }),
    prisma.inventoryTransaction.count({ where }),
  ]);
  return { items, total, page, limit };
}

export async function createTransaction(
  data: { bookId: string; type: 'import' | 'export' | 'adjustment'; quantity: number; unitCost?: number; note?: string },
  createdBy: string,
) {
  const result = await prisma.$transaction(async (tx) => {
    const book = await tx.book.findUnique({ where: { id: data.bookId } });
    if (!book) throw AppError.notFound('Book');

    if (data.quantity === 0) throw AppError.badRequest('Inventory quantity cannot be zero');

    if (data.quantity > 0) {
      await tx.book.update({
        where: { id: data.bookId },
        data: { stockQuantity: { increment: data.quantity } },
      });
    } else {
      const affectedRows = await tx.book.updateMany({
        where: { id: data.bookId, stockQuantity: { gte: Math.abs(data.quantity) } },
        data: { stockQuantity: { decrement: Math.abs(data.quantity) } },
      });
      if (affectedRows.count === 0) throw AppError.badRequest('Resulting stock cannot be negative');
    }

    const updatedBook = await tx.book.findUniqueOrThrow({ where: { id: data.bookId } });

    const txn = await tx.inventoryTransaction.create({
      data: {
        bookId: data.bookId,
        type: data.type,
        quantity: data.quantity,
        unitCost: data.unitCost ?? null,
        note: data.note ?? null,
        createdBy,
      },
    });

    return { book: updatedBook, txn };
  });

  if (result.book.stockQuantity <= env.LOW_STOCK_THRESHOLD && result.book.stockQuantity >= 0) {
    try {
      const io = getIO();
      const payload = {
        bookId: result.book.id,
        title: result.book.title,
        stockQuantity: result.book.stockQuantity,
      };
      io.to('role:staff').to('role:admin').emit('inventory:lowStock', payload);
      io.to('role:staff').to('role:admin').emit('inventory:low-stock', payload);
    } catch {
      // socket not initialized
    }
  }

  return result.txn;
}
