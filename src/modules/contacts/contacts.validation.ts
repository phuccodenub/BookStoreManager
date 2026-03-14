import { z } from 'zod';

export const createContactSchema = z.object({
  customerName: z.string().min(1).max(120),
  email: z.string().email().max(255),
  phone: z.string().max(20).optional(),
  subject: z.string().min(1).max(200),
  content: z.string().min(1).max(2000),
});

export const updateContactSchema = z.object({
  status: z.enum(['new', 'in_progress', 'resolved']).optional(),
  assignedTo: z.string().uuid().nullable().optional(),
  note: z.string().max(1000).nullable().optional(),
});

export const contactIdParam = z.object({ id: z.string().uuid() });

export const contactQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20),
  status: z.string().optional(),
  search: z.string().optional(),
});
