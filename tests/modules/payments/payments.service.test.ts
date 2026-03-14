import { beforeEach, describe, expect, test, vi } from 'vitest';

const prismaMock = vi.hoisted(() => ({
  $transaction: vi.fn(),
  order: {
    findUnique: vi.fn(),
  },
}));

const txMock = vi.hoisted(() => ({
  order: {
    findUnique: vi.fn(),
    updateMany: vi.fn(),
  },
  payment: {
    upsert: vi.fn(),
  },
}));

const getIOMock = vi.hoisted(() => vi.fn(() => ({
  to: vi.fn(() => ({ emit: vi.fn() })),
})));

vi.mock('../../../src/shared/prisma/index.js', () => ({
  prisma: prismaMock,
}));

vi.mock('../../../src/shared/socket/index.js', () => ({
  getIO: getIOMock,
}));

const paymentsService = await import('../../../src/modules/payments/payments.service.js');

describe('payments.service.handleWebhook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.$transaction.mockImplementation(async (callback: (tx: typeof txMock) => Promise<unknown>) => callback(txMock));
  });

  test('rejects webhook payloads with an amount mismatch', async () => {
    txMock.order.findUnique.mockResolvedValue({
      id: 'order-1',
      orderCode: 'ORD-1',
      userId: 'user-1',
      paymentMethod: 'online',
      paymentStatus: 'unpaid',
      totalAmount: 100_000,
      payment: null,
    });

    await expect(
      paymentsService.handleWebhook({
        orderCode: 'ORD-1',
        transactionCode: 'TX-1',
        amount: 90_000,
        status: 'paid',
      }),
    ).rejects.toThrow('Payment amount mismatch');
  });

  test('rejects payment status regression from paid to failed', async () => {
    txMock.order.findUnique.mockResolvedValue({
      id: 'order-1',
      orderCode: 'ORD-1',
      userId: 'user-1',
      paymentMethod: 'online',
      paymentStatus: 'paid',
      totalAmount: 100_000,
      payment: null,
    });

    await expect(
      paymentsService.handleWebhook({
        orderCode: 'ORD-1',
        transactionCode: 'TX-1',
        amount: 100_000,
        status: 'failed',
      }),
    ).rejects.toThrow('Cannot change payment from paid to failed');
  });

  test('rejects stale webhook updates when the payment state changes concurrently', async () => {
    txMock.order.findUnique.mockResolvedValue({
      id: 'order-1',
      orderCode: 'ORD-1',
      userId: 'user-1',
      paymentMethod: 'online',
      paymentStatus: 'unpaid',
      orderStatus: 'pending',
      totalAmount: 100_000,
      payment: null,
    });
    txMock.order.updateMany.mockResolvedValue({ count: 0 });

    await expect(
      paymentsService.handleWebhook({
        orderCode: 'ORD-1',
        transactionCode: 'TX-1',
        amount: 100_000,
        status: 'paid',
      }),
    ).rejects.toThrow('Payment status changed, please retry');
  });
});

describe('payments.service.getPaymentByOrderId', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('allows the order owner to read payment details', async () => {
    prismaMock.order.findUnique.mockResolvedValue({
      id: 'order-1',
      orderCode: 'ORD-1',
      userId: 'user-1',
      paymentMethod: 'online',
      paymentStatus: 'paid',
      totalAmount: 100_000,
      payment: {
        id: 'payment-1',
        provider: 'mock_gateway',
        transactionCode: 'TX-1',
        amount: 100_000,
        status: 'paid',
        paidAt: new Date('2026-03-14T10:00:00.000Z'),
      },
    });

    const result = await paymentsService.getPaymentByOrderId('order-1', {
      userId: 'user-1',
      role: 'customer',
    });

    expect(result.orderCode).toBe('ORD-1');
    expect(result.payment?.transactionCode).toBe('TX-1');
  });

  test('rejects a customer reading another customer payment details', async () => {
    prismaMock.order.findUnique.mockResolvedValue({
      id: 'order-1',
      orderCode: 'ORD-1',
      userId: 'user-2',
      paymentMethod: 'online',
      paymentStatus: 'paid',
      totalAmount: 100_000,
      payment: null,
    });

    await expect(
      paymentsService.getPaymentByOrderId('order-1', {
        userId: 'user-1',
        role: 'customer',
      }),
    ).rejects.toThrow('Cannot view payment for this order');
  });

  test('allows staff to read payment details for any order', async () => {
    prismaMock.order.findUnique.mockResolvedValue({
      id: 'order-1',
      orderCode: 'ORD-1',
      userId: 'user-2',
      paymentMethod: 'cod',
      paymentStatus: 'unpaid',
      totalAmount: 100_000,
      payment: null,
    });

    const result = await paymentsService.getPaymentByOrderId('order-1', {
      userId: 'staff-1',
      role: 'staff',
    });

    expect(result.paymentStatus).toBe('unpaid');
    expect(result.payment).toBeNull();
  });
});
