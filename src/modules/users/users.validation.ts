import { z } from 'zod';

export const updateProfileSchema = z.object({
  fullName: z.string().min(2).max(120).optional(),
  phone: z.string().max(20).optional(),
});

export const adminCreateUserSchema = z.object({
  fullName: z.string().min(2).max(120),
  email: z.string().email().max(255),
  phone: z.string().max(20).optional(),
  password: z.string().min(8).max(72),
  role: z.enum(['customer', 'staff', 'admin']),
});

export const adminUpdateUserSchema = z.object({
  fullName: z.string().min(2).max(120).optional(),
  phone: z.string().max(20).optional(),
  role: z.enum(['customer', 'staff', 'admin']).optional(),
});

export const updateStatusSchema = z.object({
  status: z.enum(['active', 'locked']),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().optional(),
  role: z.enum(['customer', 'staff', 'admin']).optional(),
  status: z.enum(['active', 'locked']).optional(),
});

export const idParamSchema = z.object({
  id: z.string().uuid(),
});
