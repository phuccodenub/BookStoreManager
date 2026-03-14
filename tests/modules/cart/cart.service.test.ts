import { beforeEach, describe, expect, test, vi } from 'vitest';

const prismaMock = vi.hoisted(() => ({
  book: { findUnique: vi.fn() },
  cart: { findUnique: vi.fn(), create: vi.fn() },
  cartItem: { findUnique: vi.fn(), update: vi.fn(), create: vi.fn() },
}));

vi.mock('../../../src/shared/prisma/index.js', () => ({
  prisma: prismaMock,
}));

const cartService = await import('../../../src/modules/cart/cart.service.js');

describe('cart.service.addItem', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('rejects when the final quantity would exceed stock', async () => {
    prismaMock.book.findUnique.mockResolvedValue({
      id: 'book-1',
      status: 'active',
      stockQuantity: 5,
    });
    prismaMock.cart.findUnique.mockResolvedValue({ id: 'cart-1' });
    prismaMock.cartItem.findUnique.mockResolvedValue({
      id: 'item-1',
      quantity: 4,
    });

    await expect(cartService.addItem('user-1', 'book-1', 2)).rejects.toThrow(
      'Not enough stock',
    );
  });
});
