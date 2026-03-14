import { z } from 'zod';

export const addItemSchema = z.object({
  bookId: z.string().uuid(),
  quantity: z.coerce.number().int().positive().default(1),
});

export const updateItemSchema = z.object({
  quantity: z.coerce.number().int().positive().optional(),
  selected: z.boolean().optional(),
});

export const itemIdParam = z.object({ id: z.string().uuid() });
