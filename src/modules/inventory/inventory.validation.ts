import { z } from 'zod';

const inventoryTransactionTypeSchema = z.enum(['import', 'export', 'adjustment', 'order_confirm', 'order_cancel']);

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

export const inventoryImportSchema = z.object({
  bookId: z.string().uuid(),
  quantity: z.coerce.number().int().positive(),
  unitCost: z.coerce.number().nonnegative().optional(),
  note: z.string().max(500).optional(),
});

export const inventoryExportSchema = z.object({
  bookId: z.string().uuid(),
  quantity: z.coerce.number().int().positive(),
  unitCost: z.coerce.number().nonnegative().optional(),
  note: z.string().max(500).optional(),
});

export const inventoryAdjustmentSchema = z.object({
  bookId: z.string().uuid(),
  quantity: z.coerce.number().int().refine((value) => value !== 0, { message: 'Adjustment quantity cannot be zero' }),
  unitCost: z.coerce.number().nonnegative().optional(),
  note: z.string().max(500).optional(),
});

export const inventoryQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20),
  bookId: z.string().uuid().optional(),
  type: inventoryTransactionTypeSchema.optional(),
});
