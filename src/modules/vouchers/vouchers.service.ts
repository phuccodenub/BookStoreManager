import { prisma } from '../../shared/prisma/index.js';
import { AppError } from '../../shared/errors/index.js';
import type { Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

/* ---------- ADMIN CRUD ---------- */

export async function list(query: { page: number; limit: number; search?: string; status?: string }) {
  const { page, limit, search, status } = query;
  const where: Prisma.VoucherWhereInput = {};
  if (search) where.code = { contains: search, mode: 'insensitive' };
  if (status !== undefined) where.status = status === 'true';

  const [items, total] = await Promise.all([
    prisma.voucher.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: 'desc' } }),
    prisma.voucher.count({ where }),
  ]);
  return { items, total, page, limit };
}

export async function getById(id: string) {
  const v = await prisma.voucher.findUnique({ where: { id } });
  if (!v) throw AppError.notFound('Voucher');
  return v;
}

export async function create(data: {
  code: string; type: 'percent' | 'fixed'; value: number;
  minOrderValue?: number; maxDiscountValue?: number;
  startDate: Date; endDate: Date; usageLimit?: number; status?: boolean;
}) {
  const exists = await prisma.voucher.findUnique({ where: { code: data.code } });
  if (exists) throw AppError.conflict('Voucher code already exists');
  return prisma.voucher.create({
    data: {
      code: data.code,
      type: data.type,
      value: data.value,
      minOrderValue: data.minOrderValue ?? null,
      maxDiscountValue: data.maxDiscountValue ?? null,
      startDate: data.startDate,
      endDate: data.endDate,
      usageLimit: data.usageLimit ?? 0,
      status: data.status ?? true,
    },
  });
}

export async function update(id: string, data: Record<string, unknown>) {
  await getById(id);
  if (data['code']) {
    const dup = await prisma.voucher.findFirst({ where: { code: data['code'] as string, id: { not: id } } });
    if (dup) throw AppError.conflict('Voucher code already exists');
  }
  return prisma.voucher.update({ where: { id }, data: data as Prisma.VoucherUpdateInput });
}

export async function remove(id: string) {
  await getById(id);
  await prisma.voucher.delete({ where: { id } });
}

/* ---------- CUSTOMER ---------- */

export async function validateVoucher(code: string, orderSubtotal: number) {
  const v = await prisma.voucher.findUnique({ where: { code: code.toUpperCase() } });
  if (!v) throw AppError.notFound('Voucher');
  if (!v.status) throw AppError.badRequest('Voucher is disabled');

  const now = new Date();
  if (now < v.startDate || now > v.endDate) throw AppError.badRequest('Voucher is expired or not yet valid');
  if (v.usageLimit > 0 && v.usedCount >= v.usageLimit) throw AppError.badRequest('Voucher usage limit reached');
  if (v.minOrderValue && orderSubtotal < Number(v.minOrderValue)) {
    throw AppError.badRequest(`Minimum order value is ${v.minOrderValue}`);
  }

  let discount: number;
  if (v.type === 'percent') {
    discount = Math.round(orderSubtotal * Number(v.value) / 100);
    if (v.maxDiscountValue && discount > Number(v.maxDiscountValue)) {
      discount = Number(v.maxDiscountValue);
    }
  } else {
    discount = Number(v.value);
  }
  if (discount > orderSubtotal) discount = orderSubtotal;

  return { voucherId: v.id, code: v.code, type: v.type, value: Number(v.value), discount };
}

/** Calculate discount + increment usedCount inside a transaction  */
export function calcDiscountTx(voucher: {
  id: string; type: string; value: Decimal;
  minOrderValue: Decimal | null; maxDiscountValue: Decimal | null;
  usageLimit: number; usedCount: number; startDate: Date; endDate: Date; status: boolean;
}, subtotal: number): number {
  if (!voucher.status) throw AppError.badRequest('Voucher is disabled');
  const now = new Date();
  if (now < voucher.startDate || now > voucher.endDate) throw AppError.badRequest('Voucher expired');
  if (voucher.usageLimit > 0 && voucher.usedCount >= voucher.usageLimit) throw AppError.badRequest('Voucher limit reached');
  if (voucher.minOrderValue && subtotal < Number(voucher.minOrderValue)) throw AppError.badRequest('Order below minimum');

  let discount: number;
  if (voucher.type === 'percent') {
    discount = Math.round(subtotal * Number(voucher.value) / 100);
    if (voucher.maxDiscountValue && discount > Number(voucher.maxDiscountValue)) discount = Number(voucher.maxDiscountValue);
  } else {
    discount = Number(voucher.value);
  }
  return Math.min(discount, subtotal);
}
