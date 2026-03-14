import PDFDocument from 'pdfkit';

type OrderDocumentKind = 'invoice' | 'delivery-note';
type NumericLike = number | string | { toString(): string };

interface OrderDocumentItem {
  bookNameSnapshot: string;
  quantity: number;
  unitPrice: NumericLike;
  totalPrice: NumericLike;
}

interface OrderDocumentData {
  orderCode: string;
  createdAt: Date;
  receiverName: string;
  receiverPhone: string;
  addressSnapshot: string;
  orderStatus: string;
  paymentMethod: string;
  paymentStatus: string;
  note?: string | null;
  subtotal: NumericLike;
  shippingFee: NumericLike;
  discountAmount: NumericLike;
  totalAmount: NumericLike;
  items: OrderDocumentItem[];
}

function formatMoney(value: NumericLike): string {
  return `VND ${new Intl.NumberFormat('en-US').format(Number(value.toString()))}`;
}

function formatDate(value: Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(value);
}

function writeSectionTitle(doc: PDFKit.PDFDocument, title: string) {
  doc.moveDown().fontSize(14).font('Helvetica-Bold').text(title);
  doc.moveDown(0.3).font('Helvetica').fontSize(11);
}

export async function renderOrderPdf(order: OrderDocumentData, kind: OrderDocumentKind): Promise<Buffer> {
  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  const chunks: Buffer[] = [];

  const bufferPromise = new Promise<Buffer>((resolve, reject) => {
    doc.on('data', (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });

  const title = kind === 'invoice' ? 'Invoice' : 'Delivery Note';

  doc.info.Title = `${title} ${order.orderCode}`;
  doc.fontSize(22).font('Helvetica-Bold').text(title, { align: 'center' });
  doc.moveDown(0.5);
  doc.fontSize(11).font('Helvetica');
  doc.text(`Order code: ${order.orderCode}`);
  doc.text(`Created at: ${formatDate(order.createdAt)}`);
  doc.text(`Order status: ${order.orderStatus}`);
  doc.text(`Payment method: ${order.paymentMethod}`);
  doc.text(`Payment status: ${order.paymentStatus}`);

  writeSectionTitle(doc, 'Receiver');
  doc.text(`Name: ${order.receiverName}`);
  doc.text(`Phone: ${order.receiverPhone}`);
  doc.text(`Address: ${order.addressSnapshot}`);
  if (order.note) {
    doc.text(`Note: ${order.note}`);
  }

  writeSectionTitle(doc, 'Items');
  order.items.forEach((item, index) => {
    doc.text(
      `${index + 1}. ${item.bookNameSnapshot} | Qty: ${item.quantity} | Unit: ${formatMoney(item.unitPrice)} | Total: ${formatMoney(item.totalPrice)}`,
    );
  });

  if (kind === 'invoice') {
    writeSectionTitle(doc, 'Summary');
    doc.text(`Subtotal: ${formatMoney(order.subtotal)}`);
    doc.text(`Shipping fee: ${formatMoney(order.shippingFee)}`);
    doc.text(`Discount: ${formatMoney(order.discountAmount)}`);
    doc.font('Helvetica-Bold').text(`Grand total: ${formatMoney(order.totalAmount)}`);
  } else {
    writeSectionTitle(doc, 'Handling');
    doc.text('Please verify package condition and receiver details before handoff.');
    doc.moveDown(2);
    doc.text('Prepared by: ____________________');
    doc.moveDown(1);
    doc.text('Received by: ____________________');
  }

  doc.end();

  return bufferPromise;
}
