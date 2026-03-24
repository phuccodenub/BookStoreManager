import { beforeEach, describe, expect, test, vi } from 'vitest';

const prismaMock = vi.hoisted(() => ({
  $transaction: vi.fn(),
}));

const txMock = vi.hoisted(() => ({
  order: {
    findUnique: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
  },
  payment: {
    upsert: vi.fn(),
  },
  book: {
    updateMany: vi.fn(),
    findUnique: vi.fn(),
  },
  inventoryTransaction: {
    create: vi.fn(),
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

const fulfillmentService = await import('../../../src/modules/fulfillment/fulfillment.service.js');

describe('fulfillment.service.transitionOrder', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.$transaction.mockImplementation(async (callback: (tx: typeof txMock) => Promise<unknown>) => callback(txMock));
  });

  test('rejects stale state transitions when the order status changes concurrently', async () => {
    txMock.order.findUnique.mockResolvedValue({
      id: 'order-1',
      userId: 'user-1',
      orderCode: 'ORD-1',
      orderStatus: 'pending',
      paymentMethod: 'cod',
      paymentStatus: 'unpaid',
      totalAmount: 100_000,
      items: [],
    });
    txMock.order.update.mockResolvedValue({
      id: 'order-1',
      orderStatus: 'confirmed',
    });
    txMock.order.updateMany.mockResolvedValue({ count: 0 });

    await expect(
      fulfillmentService.transitionOrder('order-1', 'confirmed', 'staff-1'),
    ).rejects.toThrow('Trạng thái đơn hàng đã thay đổi, vui lòng thử lại');
  });
});
