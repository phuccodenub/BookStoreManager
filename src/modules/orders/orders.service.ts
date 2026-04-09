import { prisma } from '../../shared/prisma/index.js';
import { env } from '../../shared/config/index.js';
import { AppError } from '../../shared/errors/index.js';
import { ORDER_STATUS_TRANSITIONS } from '../../shared/constants/index.js';
import { getIO } from '../../shared/socket/index.js';
import { calcDiscountTx } from '../vouchers/vouchers.service.js';
import type { Prisma } from '@prisma/client';
import crypto from 'node:crypto';
import type { OrderStatus, PaymentStatus } from '../../shared/constants/index.js';
import {
  decorateOrderRecord,
  getSalesChannelSearchFilter,
  serializeOrderCustomerNote,
  type SalesChannel,
} from './orders.metadata.js';

function generateOrderCode(): string {
  const date = new Date();
  const ymd = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
  const rand = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `ORD-${ymd}-${rand}`;
}

function normalizeDateBoundary(value: string | undefined, kind: 'start' | 'end') {
  if (!value) {
    return null;
  }

  const normalized = value.length <= 10
    ? new Date(`${value}T${kind === 'start' ? '00:00:00.000' : '23:59:59.999'}Z`)
    : new Date(value);

  return Number.isNaN(normalized.getTime()) ? null : normalized;
}

function decorateOrderCollection<T extends { note?: string | null }>(orders: T[]) {
  return orders.map((order) => decorateOrderRecord(order));
}

export async function createOrder(userId: string, data: {
  addressId: string; paymentMethod: 'cod' | 'online'; voucherCode?: string; note?: string; cartItemIds?: string[];
}) {
  const createdOrder = await prisma.$transaction(async (tx) => {
    const address = await tx.address.findFirst({ where: { id: data.addressId, userId } });
    if (!address) throw AppError.badRequest('Address not found');

    const config = await tx.systemConfig.findUnique({ where: { id: 'default' } });
    const shippingFee = Number(config?.shippingFee ?? env.DEFAULT_SHIPPING_FEE);

    const cart = await tx.cart.findUnique({ where: { userId }, include: { items: { include: { book: true } } } });
    if (!cart || cart.items.length === 0) throw AppError.badRequest('Cart is empty');

    let items = cart.items.filter(i => i.selected);
    if (data.cartItemIds?.length) {
      items = items.filter(i => data.cartItemIds!.includes(i.id));
    }
    if (items.length === 0) throw AppError.badRequest('No items selected');

    let subtotal = 0;
    for (const item of items) {
      if (item.book.status !== 'active') throw AppError.badRequest(`Book "${item.book.title}" is not available`);
      if (item.quantity > item.book.stockQuantity) throw AppError.badRequest(`Not enough stock for "${item.book.title}"`);
      subtotal += Number(item.book.price) * item.quantity;
    }

    let voucherId: string | null = null;
    let discountAmount = 0;
    if (data.voucherCode) {
      const voucher = await tx.voucher.findUnique({ where: { code: data.voucherCode.toUpperCase() } });
      if (!voucher) throw AppError.badRequest('Voucher not found');
      discountAmount = calcDiscountTx(voucher, subtotal);
      voucherId = voucher.id;
      const updatedVoucher = await tx.voucher.updateMany({
        where: { id: voucher.id, usedCount: voucher.usedCount },
        data: { usedCount: { increment: 1 } },
      });
      if (updatedVoucher.count === 0) {
        throw AppError.badRequest('Voucher usage changed, please retry');
      }
    }

    const totalAmount = subtotal + shippingFee - discountAmount;
    const addressSnapshot = `${address.receiverName}, ${address.receiverPhone}, ${address.detailAddress}, ${address.ward}, ${address.district}, ${address.province}`;

    const order = await tx.order.create({
      data: {
        orderCode: generateOrderCode(),
        userId,
        voucherId,
        receiverName: address.receiverName,
        receiverPhone: address.receiverPhone,
        addressSnapshot,
        paymentMethod: data.paymentMethod,
        subtotal,
        shippingFee,
        discountAmount,
        totalAmount,
        note: serializeOrderCustomerNote(data.note, 'website'),
        items: {
          create: items.map(i => ({
            bookId: i.bookId,
            bookNameSnapshot: i.book.title,
            quantity: i.quantity,
            unitPrice: Number(i.book.price),
            totalPrice: Number(i.book.price) * i.quantity,
          })),
        },
      },
      include: { items: true },
    });

    await tx.cartItem.deleteMany({ where: { id: { in: items.map(i => i.id) } } });

    return order;
  });

  try {
    const io = getIO();
    const payload = {
      orderId: createdOrder.id,
      orderCode: createdOrder.orderCode,
      orderStatus: createdOrder.orderStatus,
    };
    io.to(`user:${userId}`).emit('order:created', payload);
    io.to('role:staff').to('role:admin').emit('order:created', payload);
    io.to('role:staff').to('role:admin').emit('notification:new', {
      type: 'order',
      ...payload,
    });
  } catch {
    // socket not initialized
  }

  return decorateOrderRecord(createdOrder);
}

export async function createManualOrder(actorUserId: string, data: {
  userId: string;
  receiverName: string;
  receiverPhone: string;
  province: string;
  district: string;
  ward: string;
  detailAddress: string;
  paymentMethod: 'cod' | 'online';
  paymentStatus?: Exclude<PaymentStatus, 'refunded'>;
  salesChannel?: SalesChannel;
  shippingFee?: number;
  voucherCode?: string;
  customerNote?: string;
  items: Array<{ bookId: string; quantity: number }>;
}) {
  const createdOrder = await prisma.$transaction(async (tx) => {
    const customer = await tx.user.findUnique({ where: { id: data.userId } });
    if (!customer) throw AppError.badRequest('Customer not found');

    const config = await tx.systemConfig.findUnique({ where: { id: 'default' } });
    const shippingFee = data.shippingFee ?? Number(config?.shippingFee ?? env.DEFAULT_SHIPPING_FEE);
    const paymentStatus = data.paymentStatus ?? (data.paymentMethod === 'online' ? 'pending' : 'unpaid');
    const salesChannel = data.salesChannel ?? 'hotline';
    const requestedBookIds = [...new Set(data.items.map((item) => item.bookId))];
    const books = await tx.book.findMany({
      where: { id: { in: requestedBookIds } },
      select: { id: true, title: true, price: true, stockQuantity: true, status: true },
    });

    if (books.length !== requestedBookIds.length) {
      throw AppError.badRequest('One or more books were not found');
    }

    const bookMap = new Map(books.map((book) => [book.id, book]));
    let subtotal = 0;

    for (const item of data.items) {
      const book = bookMap.get(item.bookId);
      if (!book) throw AppError.badRequest('Book not found');
      if (book.status !== 'active') throw AppError.badRequest(`Book "${book.title}" is not available`);
      if (item.quantity > book.stockQuantity) throw AppError.badRequest(`Not enough stock for "${book.title}"`);
      subtotal += Number(book.price) * item.quantity;
    }

    let voucherId: string | null = null;
    let discountAmount = 0;
    if (data.voucherCode) {
      const voucher = await tx.voucher.findUnique({ where: { code: data.voucherCode.toUpperCase() } });
      if (!voucher) throw AppError.badRequest('Voucher not found');
      discountAmount = calcDiscountTx(voucher, subtotal);
      voucherId = voucher.id;
      const updatedVoucher = await tx.voucher.updateMany({
        where: { id: voucher.id, usedCount: voucher.usedCount },
        data: { usedCount: { increment: 1 } },
      });
      if (updatedVoucher.count === 0) {
        throw AppError.badRequest('Voucher usage changed, please retry');
      }
    }

    const totalAmount = subtotal + shippingFee - discountAmount;
    const addressSnapshot = `${data.receiverName}, ${data.receiverPhone}, ${data.detailAddress}, ${data.ward}, ${data.district}, ${data.province}`;

    const order = await tx.order.create({
      data: {
        orderCode: generateOrderCode(),
        userId: data.userId,
        voucherId,
        receiverName: data.receiverName,
        receiverPhone: data.receiverPhone,
        addressSnapshot,
        paymentMethod: data.paymentMethod,
        paymentStatus,
        subtotal,
        shippingFee,
        discountAmount,
        totalAmount,
        note: serializeOrderCustomerNote(data.customerNote, salesChannel),
        items: {
          create: data.items.map((item) => {
            const book = bookMap.get(item.bookId);
            return {
              bookId: item.bookId,
              bookNameSnapshot: book?.title ?? 'Sản phẩm',
              quantity: item.quantity,
              unitPrice: Number(book?.price ?? 0),
              totalPrice: Number(book?.price ?? 0) * item.quantity,
            };
          }),
        },
        ...(paymentStatus !== 'unpaid'
          ? {
              payment: {
                create: {
                  provider: 'manual_admin',
                  amount: totalAmount,
                  status: paymentStatus,
                  paidAt: paymentStatus === 'paid' ? new Date() : null,
                },
              },
            }
          : {}),
      },
      include: { items: true, payment: true },
    });

    return order;
  });

  try {
    const io = getIO();
    const payload = {
      orderId: createdOrder.id,
      orderCode: createdOrder.orderCode,
      orderStatus: createdOrder.orderStatus,
    };
    io.to(`user:${createdOrder.userId}`).emit('order:created', payload);
    io.to('role:staff').to('role:admin').emit('order:created', payload);
    io.to('role:staff').to('role:admin').emit('notification:new', {
      type: 'order',
      ...payload,
    });
  } catch {
    // socket not initialized
  }

  return decorateOrderRecord(createdOrder);
}

export async function listMyOrders(userId: string, query: { page: number; limit: number; status?: OrderStatus }) {
  const { page, limit, status } = query;
  const where: Prisma.OrderWhereInput = { userId };
  if (status) where.orderStatus = status as never;

  const [items, total] = await Promise.all([
    prisma.order.findMany({
      where, skip: (page - 1) * limit, take: limit,
      orderBy: { createdAt: 'desc' },
      include: { items: true },
    }),
    prisma.order.count({ where }),
  ]);
  return { items: decorateOrderCollection(items), total, page, limit };
}

export async function getMyOrder(userId: string, orderId: string) {
  const order = await prisma.order.findFirst({
    where: { id: orderId, userId },
    include: { items: true, payment: true, voucher: true },
  });
  if (!order) throw AppError.notFound('Order');
  return decorateOrderRecord(order);
}

export async function cancelMyOrder(userId: string, orderId: string, reason: string) {
  const { previousStatus, cancelledOrder } = await prisma.$transaction(async (tx) => {
    const order = await tx.order.findFirst({ where: { id: orderId, userId } });
    if (!order) throw AppError.notFound('Order');
    if (order.orderStatus !== 'pending') throw AppError.badRequest('Only pending orders can be cancelled');
    if (order.paymentMethod === 'online' && order.paymentStatus === 'paid') {
      throw AppError.badRequest('Paid online orders cannot be cancelled');
    }

    const updatedOrder = await tx.order.updateMany({
      where: {
        id: orderId,
        userId,
        orderStatus: 'pending',
        ...(order.paymentMethod === 'online'
          ? { paymentStatus: { in: ['unpaid', 'pending', 'failed'] as const } }
          : {}),
      },
      data: { orderStatus: 'cancelled', cancelledReason: reason },
    });

    if (updatedOrder.count === 0) {
      throw AppError.badRequest('Order status changed, please retry');
    }

    if (order.voucherId) {
      const voucherUpdate = await tx.voucher.updateMany({
        where: { id: order.voucherId, usedCount: { gt: 0 } },
        data: { usedCount: { decrement: 1 } },
      });
      if (voucherUpdate.count === 0) {
        throw AppError.conflict('Voucher usage changed, please retry');
      }
    }

    const cancelledOrder = await tx.order.findUnique({ where: { id: orderId } });
    if (!cancelledOrder) throw AppError.notFound('Order');

    return { previousStatus: order.orderStatus, cancelledOrder };
  });

  try {
    const io = getIO();
    const payload = {
      orderId: cancelledOrder.id,
      orderCode: cancelledOrder.orderCode,
      from: previousStatus,
      to: cancelledOrder.orderStatus,
    };
    io.to(`user:${userId}`).emit('order:updated', payload);
    io.to(`user:${userId}`).emit('order:statusChanged', payload);
    io.to('role:staff').to('role:admin').emit('order:updated', payload);
    io.to('role:staff').to('role:admin').emit('order:statusChanged', payload);
  } catch {
    // socket not initialized
  }

  return decorateOrderRecord(cancelledOrder);
}

export async function listAll(query: {
  page: number;
  limit: number;
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  salesChannel?: SalesChannel;
  search?: string;
  userId?: string;
  from?: string;
  to?: string;
}) {
  const { page, limit, status, paymentStatus, salesChannel, search, userId, from, to } = query;
  const filters: Prisma.OrderWhereInput[] = [];

  if (status) filters.push({ orderStatus: status as never });
  if (paymentStatus) filters.push({ paymentStatus: paymentStatus as never });
  if (userId) filters.push({ userId });
  if (search) {
    filters.push({
      OR: [
        { orderCode: { contains: search, mode: 'insensitive' } },
        { receiverName: { contains: search, mode: 'insensitive' } },
        { receiverPhone: { contains: search } },
      ],
    });
  }

  const createdAt: Prisma.DateTimeFilter = {};
  const fromDate = normalizeDateBoundary(from, 'start');
  const toDate = normalizeDateBoundary(to, 'end');
  if (fromDate) createdAt.gte = fromDate;
  if (toDate) createdAt.lte = toDate;
  if (Object.keys(createdAt).length > 0) {
    filters.push({ createdAt });
  }

  if (salesChannel) {
    filters.push(getSalesChannelSearchFilter(salesChannel));
  }

  const where: Prisma.OrderWhereInput = filters.length > 0 ? { AND: filters } : {};
  const [items, total] = await Promise.all([
    prisma.order.findMany({
      where, skip: (page - 1) * limit, take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        items: true,
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
          },
        },
      },
    }),
    prisma.order.count({ where }),
  ]);
  return { items: decorateOrderCollection(items), total, page, limit };
}

export async function getOrderById(id: string) {
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: { include: { book: { select: { id: true, slug: true, coverImage: true } } } },
      payment: true,
      voucher: true,
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
          _count: { select: { orders: true } },
        },
      },
    },
  });
  if (!order) throw AppError.notFound('Order');
  return decorateOrderRecord(order);
}

export async function updateOrderStatus(orderId: string, newStatus: string, cancelledReason?: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw AppError.notFound('Order');

  const allowed = ORDER_STATUS_TRANSITIONS[order.orderStatus] || [];
  if (!allowed.includes(newStatus)) {
    throw AppError.badRequest(`Cannot transition from ${order.orderStatus} to ${newStatus}`);
  }

  const updateData: Prisma.OrderUpdateInput = { orderStatus: newStatus as never };
  if (newStatus === 'cancelled' && cancelledReason) updateData.cancelledReason = cancelledReason;

  const updatedOrder = await prisma.order.update({ where: { id: orderId }, data: updateData, include: { items: true } });
  return decorateOrderRecord(updatedOrder);
}
