import { z } from 'zod';

export const createReviewSchema = z.object({
  bookId: z.string().uuid(),
  orderId: z.string().uuid(),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
});

export const createReviewByBookSchema = z.object({
  orderId: z.string().uuid(),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
});

export const updateReviewSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5).optional(),
  comment: z.string().max(1000).optional(),
}).refine((value) => Object.keys(value).length > 0, {
  message: 'At least one field must be provided',
});

export const reviewQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20),
});

export const reviewBookParam = z.object({ bookId: z.string().uuid() });
export const reviewIdParam = z.object({ id: z.string().uuid() });
