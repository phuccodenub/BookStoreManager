import { z } from 'zod';
import { OrderStatus } from '../../shared/constants/index.js';
import { SALES_CHANNELS } from './orders.metadata.js';

const orderStatusSchema = z.enum([
  OrderStatus.PENDING,
  OrderStatus.CONFIRMED,
  OrderStatus.PACKING,
  OrderStatus.SHIPPING,
  OrderStatus.COMPLETED,
  OrderStatus.CANCELLED,
]);

export const createOrderSchema = z.object({
  addressId: z.string().uuid(),
  paymentMethod: z.enum(['cod', 'online']),
  voucherCode: z.string().optional(),
  note: z.string().max(500).optional(),
  /** List of selected cart item IDs; if omitted → all selected items */
  cartItemIds: z.array(z.string().uuid()).optional(),
});

export const orderIdParam = z.object({ id: z.string().uuid() });

export const cancelOrderSchema = z.object({
  cancelledReason: z.string().min(1).max(500),
});

export const orderQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20),
  status: orderStatusSchema.optional(),
});

export const adminOrderQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20),
  status: orderStatusSchema.optional(),
  paymentStatus: z.enum(['unpaid', 'pending', 'paid', 'failed', 'refunded']).optional(),
  salesChannel: z.enum(SALES_CHANNELS).optional(),
  search: z.string().optional(),
  userId: z.string().uuid().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});

export const updateOrderStatusSchema = z.object({
  orderStatus: z.enum(['confirmed', 'packing', 'shipping', 'completed', 'cancelled']),
  cancelledReason: z.string().max(500).optional(),
});

export const updateOrderOpsSchema = z.object({
  trackingCode: z.string().max(100).optional(),
  internalNote: z.string().max(500).optional(),
}).refine((value) => Boolean(value.trackingCode?.trim() || value.internalNote?.trim()), {
  message: 'At least one order operation field is required',
});

export const createManualOrderSchema = z.object({
  userId: z.string().uuid(),
  receiverName: z.string().min(2).max(120),
  receiverPhone: z.string().min(8).max(20),
  province: z.string().min(2).max(100),
  district: z.string().min(2).max(100),
  ward: z.string().min(2).max(100),
  detailAddress: z.string().min(5).max(300),
  paymentMethod: z.enum(['cod', 'online']),
  paymentStatus: z.enum(['unpaid', 'pending', 'paid', 'failed']).optional(),
  salesChannel: z.enum(SALES_CHANNELS).optional(),
  shippingFee: z.coerce.number().int().nonnegative().optional(),
  voucherCode: z.string().max(50).optional(),
  customerNote: z.string().max(500).optional(),
  internalNote: z.string().max(500).optional(),
  trackingCode: z.string().max(100).optional(),
  items: z.array(z.object({
    bookId: z.string().uuid(),
    quantity: z.coerce.number().int().positive().max(999),
  })).min(1),
});
