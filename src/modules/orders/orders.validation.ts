import { z } from 'zod';
import { OrderStatus } from '../../shared/constants/index.js';

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
  search: z.string().optional(),
  userId: z.string().uuid().optional(),
});

export const updateOrderStatusSchema = z.object({
  orderStatus: z.enum(['confirmed', 'packing', 'shipping', 'completed', 'cancelled']),
  cancelledReason: z.string().max(500).optional(),
});
