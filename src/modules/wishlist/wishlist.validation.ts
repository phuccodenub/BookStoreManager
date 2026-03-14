import { z } from 'zod';

export const wishlistBookParam = z.object({ bookId: z.string().uuid() });

export const wishlistQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20),
});
