import { beforeEach, describe, expect, test, vi } from 'vitest';
import { adminOrderQuerySchema, orderQuerySchema } from '../../../src/modules/orders/orders.validation.js';

const prismaMock = vi.hoisted(() => ({
  $transaction: vi.fn(),
}));

const txMock = vi.hoisted(() => ({
  order: {
    findFirst: vi.fn(),
    updateMany: vi.fn(),
    findUnique: vi.fn(),
  },
  voucher: {
    updateMany: vi.fn(),
  },
}));

const getIOMock = vi.hoisted(() => vi.fn(() => ({
  to: vi.fn(() => ({ emit: vi.fn(), to: vi.fn(() => ({ emit: vi.fn() })) })),
})));

vi.mock('../../../src/shared/prisma/index.js', () => ({
  prisma: prismaMock,
}));

vi.mock('../../../src/shared/socket/index.js', () => ({
  getIO: getIOMock,
}));

const ordersService = await import('../../../src/modules/orders/orders.service.js');

describe('orders.service.cancelMyOrder', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.$transaction.mockImplementation(async (callback: (tx: typeof txMock) => Promise<unknown>) => callback(txMock));
  });

  test('rejects cancelling a paid online order', async () => {
    txMock.order.findFirst.mockResolvedValue({
      id: 'order-1',
      userId: 'user-1',
      orderCode: 'ORD-1',
      orderStatus: 'pending',
      paymentMethod: 'online',
      paymentStatus: 'paid',
      voucherId: null,
    });

    await expect(
      ordersService.cancelMyOrder('user-1', 'order-1', 'Changed my mind'),
    ).rejects.toThrow('Paid online orders cannot be cancelled');
  });

  test('rejects cancellation if the order becomes paid before the conditional update', async () => {
    txMock.order.findFirst.mockResolvedValue({
      id: 'order-1',
      userId: 'user-1',
      orderCode: 'ORD-1',
      orderStatus: 'pending',
      paymentMethod: 'online',
      paymentStatus: 'unpaid',
      voucherId: null,
    });
    txMock.order.updateMany.mockResolvedValue({ count: 0 });

    await expect(
      ordersService.cancelMyOrder('user-1', 'order-1', 'Changed my mind'),
    ).rejects.toThrow('Order status changed, please retry');
  });
});

describe('orders.validation', () => {
  test('rejects invalid customer order status filters before Prisma is called', () => {
    expect(() => orderQuerySchema.parse({ status: 'foo' })).toThrow();
  });

  test('rejects invalid admin order status filters before Prisma is called', () => {
    expect(() => adminOrderQuerySchema.parse({ status: 'foo' })).toThrow();
  });
});
