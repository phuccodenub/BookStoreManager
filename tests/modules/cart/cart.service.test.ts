import { Prisma } from '@prisma/client';
import { beforeEach, describe, expect, test, vi } from 'vitest';

const prismaMock = vi.hoisted(() => ({
  book: { findUnique: vi.fn() },
  cart: { findUnique: vi.fn(), upsert: vi.fn() },
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
    prismaMock.cart.upsert.mockResolvedValue({ id: 'cart-1' });
    prismaMock.cartItem.findUnique.mockResolvedValue({
      id: 'item-1',
      quantity: 4,
    });

    await expect(cartService.addItem('user-1', 'book-1', 2)).rejects.toThrow(
      'Not enough stock',
    );
  });

  test('getCart uses an upsert-backed cart lookup so concurrent first loads both resolve', async () => {
    prismaMock.cart.upsert.mockResolvedValue({ id: 'cart-1', userId: 'user-1' });
    prismaMock.cart.findUnique.mockResolvedValue({
      id: 'cart-1',
      userId: 'user-1',
      items: [],
    });

    const [first, second] = await Promise.all([
      cartService.getCart('user-1'),
      cartService.getCart('user-1'),
    ]);

    expect(first?.id).toBe('cart-1');
    expect(second?.id).toBe('cart-1');
    expect(prismaMock.cart.upsert).toHaveBeenCalledTimes(2);
    expect(prismaMock.cart.upsert).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      update: {},
      create: { userId: 'user-1' },
    });
  });

  test('getCart falls back to the existing cart when a concurrent upsert hits the unique user constraint', async () => {
    prismaMock.cart.upsert.mockRejectedValueOnce(
      new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        clientVersion: 'test',
        code: 'P2002',
        meta: { target: ['user_id'] },
      }),
    );
    prismaMock.cart.findUnique
      .mockResolvedValueOnce({ id: 'cart-1', userId: 'user-1' })
      .mockResolvedValueOnce({ id: 'cart-1', userId: 'user-1', items: [] });

    const cart = await cartService.getCart('user-1');

    expect(cart?.id).toBe('cart-1');
    expect(prismaMock.cart.findUnique).toHaveBeenCalledWith({ where: { userId: 'user-1' } });
  });
});
