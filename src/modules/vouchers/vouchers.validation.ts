import { z } from 'zod';

export const createVoucherSchema = z.object({
  code: z.string().min(3).max(50).toUpperCase(),
  type: z.enum(['percent', 'fixed']),
  value: z.coerce.number().positive(),
  minOrderValue: z.coerce.number().nonnegative().optional(),
  maxDiscountValue: z.coerce.number().nonnegative().optional(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  usageLimit: z.coerce.number().int().nonnegative().default(0),
  status: z.boolean().default(true),
}).refine(d => d.endDate > d.startDate, { message: 'endDate must be after startDate' });

export const updateVoucherSchema = z.object({
  code: z.string().min(3).max(50).toUpperCase().optional(),
  type: z.enum(['percent', 'fixed']).optional(),
  value: z.coerce.number().positive().optional(),
  minOrderValue: z.coerce.number().nonnegative().nullable().optional(),
  maxDiscountValue: z.coerce.number().nonnegative().nullable().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  usageLimit: z.coerce.number().int().nonnegative().optional(),
  status: z.boolean().optional(),
});

export const voucherIdParam = z.object({ id: z.string().uuid() });

export const validateVoucherBody = z.object({
  code: z.string().min(1),
  orderSubtotal: z.coerce.number().positive(),
});

export const voucherQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20),
  search: z.string().optional(),
  status: z.enum(['true', 'false']).optional(),
});
