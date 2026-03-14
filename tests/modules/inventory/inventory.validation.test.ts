import { describe, expect, test } from 'vitest';

import { inventoryQuerySchema } from '../../../src/modules/inventory/inventory.validation.js';

describe('inventoryQuerySchema', () => {
  test('accepts supported inventory transaction types', () => {
    const parsed = inventoryQuerySchema.parse({ type: 'order_confirm' });

    expect(parsed.type).toBe('order_confirm');
    expect(parsed.page).toBe(1);
    expect(parsed.limit).toBe(20);
  });

  test('rejects unknown inventory transaction types', () => {
    expect(() => inventoryQuerySchema.parse({ type: 'unknown' })).toThrow();
  });
});
