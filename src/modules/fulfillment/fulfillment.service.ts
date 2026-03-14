import { prisma } from '../../shared/prisma/index.js';
import { AppError } from '../../shared/errors/index.js';
import { ORDER_STATUS_TRANSITIONS } from '../../shared/constants/index.js';
import { getIO } from '../../shared/socket/index.js';

export async function transitionOrder(
  orderId: string,
  newStatus: string,
  staffId: string,
  cancelledReason?: string,
) {
  const result = await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order) throw AppError.notFound('Order');

    const allowed = ORDER_STATUS_TRANSITIONS[order.orderStatus] || [];
    if (!allowed.includes(newStatus)) {
      throw AppError.badRequest(`Cannot transition from ${order.orderStatus} to ${newStatus}`);
    }

    if (newStatus === 'confirmed') {
      for (const item of order.items) {
        const affectedRows = await tx.book.updateMany({
          where: { id: item.bookId, stockQuantity: { gte: item.quantity } },
          data: {
            stockQuantity: { decrement: item.quantity },
            soldQuantity: { increment: item.quantity },
          },
        });
        if (affectedRows.count === 0) {
          const book = await tx.book.findUnique({ where: { id: item.bookId } });
          throw AppError.badRequest(`Not enough stock for book "${item.bookNameSnapshot}" (available: ${book?.stockQuantity ?? 0}, needed: ${item.quantity})`);
        }
        await tx.inventoryTransaction.create({
          data: {
            bookId: item.bookId,
            type: 'order_confirm',
            quantity: -item.quantity,
            referenceType: 'order',
            referenceId: order.id,
            note: `Order ${order.orderCode} confirmed`,
            createdBy: staffId,
          },
        });
      }
    }

    if (newStatus === 'cancelled' && ['confirmed', 'packing'].includes(order.orderStatus)) {
      for (const item of order.items) {
        const affectedRows = await tx.book.updateMany({
          where: { id: item.bookId, soldQuantity: { gte: item.quantity } },
          data: {
            stockQuantity: { increment: item.quantity },
            soldQuantity: { decrement: item.quantity },
          },
        });
        if (affectedRows.count === 0) {
          throw AppError.badRequest(`Cannot restore inventory for "${item.bookNameSnapshot}" due to inconsistent sold quantity`);
        }
        await tx.inventoryTransaction.create({
          data: {
            bookId: item.bookId,
            type: 'order_cancel',
            quantity: item.quantity,
            referenceType: 'order',
            referenceId: order.id,
            note: `Order ${order.orderCode} cancelled – stock restored`,
            createdBy: staffId,
          },
        });
      }
    }

    if (newStatus === 'completed' && order.paymentMethod === 'online' && order.paymentStatus !== 'paid') {
      throw AppError.badRequest('Online orders can only be completed after payment succeeds');
    }

    let paymentUpdate = {};
    if (newStatus === 'completed' && order.paymentMethod === 'cod') {
      paymentUpdate = { paymentStatus: 'paid' as const };
      await tx.payment.upsert({
        where: { orderId: order.id },
        create: {
          orderId: order.id,
          provider: 'cod',
          amount: order.totalAmount,
          status: 'paid',
          paidAt: new Date(),
        },
        update: { status: 'paid', paidAt: new Date() },
      });
    }

    const updatedOrder = await tx.order.updateMany({
      where: {
        id: orderId,
        orderStatus: order.orderStatus,
        ...(newStatus === 'completed' && order.paymentMethod === 'online'
          ? { paymentStatus: 'paid' }
          : {}),
      },
      data: {
        orderStatus: newStatus as never,
        cancelledReason: newStatus === 'cancelled' ? (cancelledReason ?? null) : undefined,
        ...paymentUpdate,
      },
    });

    if (updatedOrder.count === 0) {
      throw AppError.badRequest('Order status changed, please retry');
    }

    const updated = await tx.order.findUniqueOrThrow({
      where: { id: orderId },
      include: { items: true },
    });

    return { previousOrder: order, updated };
  });

  try {
    const io = getIO();
    const payload = {
      orderId: result.previousOrder.id,
      orderCode: result.previousOrder.orderCode,
      from: result.previousOrder.orderStatus,
      to: newStatus,
    };
    io.to(`user:${result.previousOrder.userId}`).emit('order:updated', payload);
    io.to(`user:${result.previousOrder.userId}`).emit('order:statusChanged', payload);
    io.to('role:staff').to('role:admin').emit('order:updated', payload);
    io.to('role:staff').to('role:admin').emit('order:statusChanged', payload);
  } catch {
    // socket may not be initialized in tests
  }

  return result;
}
