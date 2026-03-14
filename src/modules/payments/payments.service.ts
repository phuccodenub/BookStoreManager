import { prisma } from '../../shared/prisma/index.js';
import { AppError } from '../../shared/errors/index.js';
import { getIO } from '../../shared/socket/index.js';
import type { Prisma } from '@prisma/client';
import { Role } from '../../shared/constants/index.js';

interface PaymentActor {
  userId: string;
  role: string;
}

export async function getPaymentByOrderId(orderId: string, actor: PaymentActor) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      payment: true,
    },
  });

  if (!order) throw AppError.notFound('Order');

  const canViewAllPayments = actor.role === Role.ADMIN || actor.role === Role.STAFF;
  if (!canViewAllPayments && order.userId !== actor.userId) {
    throw AppError.forbidden('Cannot view payment for this order');
  }

  return {
    orderId: order.id,
    orderCode: order.orderCode,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    totalAmount: order.totalAmount,
    payment: order.payment,
  };
}

export async function handleWebhook(data: {
  orderCode: string;
  transactionCode: string;
  amount: number;
  status: 'paid' | 'failed';
}) {
  const { order, paymentStatus } = await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { orderCode: data.orderCode },
      include: { payment: true },
    });

    if (!order) throw AppError.notFound('Order');
    if (order.paymentMethod !== 'online') throw AppError.badRequest('Order is not online payment');
    if (Number(order.totalAmount) !== data.amount) throw AppError.badRequest('Payment amount mismatch');
    if (order.orderStatus === 'cancelled') throw AppError.badRequest('Cancelled orders cannot receive payment updates');
    if (order.paymentStatus === 'paid' && data.status !== 'paid') {
      throw AppError.badRequest('Cannot change payment from paid to failed');
    }

    const paymentStatus = data.status;
    const allowedStatuses = paymentStatus === 'paid'
      ? ['unpaid', 'pending', 'failed', 'paid']
      : ['unpaid', 'pending', 'failed'];

    const updatedOrder = await tx.order.updateMany({
      where: {
        id: order.id,
        orderStatus: { not: 'cancelled' },
        paymentStatus: { in: allowedStatuses as never[] },
      },
      data: { paymentStatus },
    });

    if (updatedOrder.count === 0) {
      throw AppError.badRequest('Payment status changed, please retry');
    }

    await tx.payment.upsert({
      where: { orderId: order.id },
      create: {
        orderId: order.id,
        provider: 'mock_gateway',
        transactionCode: data.transactionCode,
        amount: data.amount,
        status: paymentStatus,
        paidAt: paymentStatus === 'paid' ? new Date() : null,
        rawResponse: data as unknown as Prisma.InputJsonValue,
      },
      update: {
        transactionCode: data.transactionCode,
        status: paymentStatus,
        paidAt: paymentStatus === 'paid' ? new Date() : null,
        rawResponse: data as unknown as Prisma.InputJsonValue,
      },
    });

    return { order, paymentStatus };
  });

  try {
    const io = getIO();
    io.to(`user:${order.userId}`).emit('payment:updated', {
      orderId: order.id,
      orderCode: order.orderCode,
      paymentStatus,
    });
    if (paymentStatus === 'paid') {
      io.to(`user:${order.userId}`).emit('payment:success', {
        orderId: order.id,
        orderCode: order.orderCode,
        paymentStatus,
      });
    }
  } catch {
    // socket not initialized
  }

  return { orderId: order.id, paymentStatus };
}
