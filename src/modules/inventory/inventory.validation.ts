import { z } from 'zod';

export const createInventoryTxSchema = z.object({
  bookId: z.string().uuid(),
  type: z.enum(['import', 'export', 'adjustment']),
  quantity: z.coerce.number().int(),
  unitCost: z.coerce.number().nonnegative().optional(),
  note: z.string().max(500).optional(),
}).refine(d => {
  if (d.type === 'import' && d.quantity <= 0) return false;
  if (d.type === 'export' && d.quantity >= 0) return false;
  return true;
}, { message: 'Import must be positive, export must be negative' });

export const inventoryQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20),
  bookId: z.string().uuid().optional(),
  type: z.string().optional(),
});
