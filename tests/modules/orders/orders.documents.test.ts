import { describe, expect, test } from 'vitest';
import { renderOrderPdf } from '../../../src/modules/orders/orders.documents.js';

describe('orders.documents.renderOrderPdf', () => {
  test('renders an invoice pdf buffer', async () => {
    const pdf = await renderOrderPdf({
      orderCode: 'ORD-20260314-ABCD1234',
      createdAt: new Date('2026-03-14T10:00:00.000Z'),
      receiverName: 'Alice Nguyen',
      receiverPhone: '0900000000',
      addressSnapshot: 'Alice Nguyen, 0900000000, 123 Sample Street',
      orderStatus: 'pending',
      paymentMethod: 'online',
      paymentStatus: 'paid',
      note: 'Ring the bell',
      subtotal: 100000,
      shippingFee: 25000,
      discountAmount: 5000,
      totalAmount: 120000,
      items: [
        {
          bookNameSnapshot: 'Clean Architecture',
          quantity: 1,
          unitPrice: 100000,
          totalPrice: 100000,
        },
      ],
    }, 'invoice');

    expect(pdf.subarray(0, 4).toString()).toBe('%PDF');
    expect(pdf.length).toBeGreaterThan(500);
  });
});
