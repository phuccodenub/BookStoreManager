import { z } from 'zod';
export const createPublisherSchema = z.object({
  name: z.string().min(1).max(200),
  address: z.string().max(300).optional(),
  phone: z.string().max(20).optional(),
  email: z.string().email().max(255).optional(),
  status: z.boolean().optional(),
});
export const updatePublisherSchema = createPublisherSchema.partial();
export const idParam = z.object({ id: z.string().uuid() });
export const listQuery = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
});
