import { prisma } from '../../shared/prisma/index.js';
import { AppError } from '../../shared/errors/index.js';

async function getOrCreateCart(userId: string) {
  let cart = await prisma.cart.findUnique({ where: { userId } });
  if (!cart) cart = await prisma.cart.create({ data: { userId } });
  return cart;
}

export async function getCart(userId: string) {
  const cart = await getOrCreateCart(userId);
  return prisma.cart.findUnique({
    where: { id: cart.id },
    include: {
      items: {
        include: {
          book: {
            select: { id: true, title: true, slug: true, coverImage: true, price: true, stockQuantity: true, status: true },
          },
        },
        orderBy: { id: 'asc' },
      },
    },
  });
}

export async function addItem(userId: string, bookId: string, quantity: number) {
  const book = await prisma.book.findUnique({ where: { id: bookId } });
  if (!book || book.status !== 'active') throw AppError.badRequest('Book is not available');
  if (quantity > book.stockQuantity) throw AppError.badRequest('Not enough stock');

  const cart = await getOrCreateCart(userId);
  const existing = await prisma.cartItem.findUnique({ where: { cartId_bookId: { cartId: cart.id, bookId } } });

  if (existing) {
    const finalQuantity = existing.quantity + quantity;
    if (finalQuantity > book.stockQuantity) throw AppError.badRequest('Not enough stock');
    return prisma.cartItem.update({
      where: { id: existing.id },
      data: { quantity: finalQuantity },
    });
  }
  return prisma.cartItem.create({ data: { cartId: cart.id, bookId, quantity } });
}

export async function updateItem(userId: string, itemId: string, data: { quantity?: number; selected?: boolean }) {
  const cart = await getOrCreateCart(userId);
  const item = await prisma.cartItem.findFirst({ where: { id: itemId, cartId: cart.id } });
  if (!item) throw AppError.notFound('CartItem');

  if (data.quantity !== undefined) {
    const book = await prisma.book.findUnique({ where: { id: item.bookId } });
    if (book && data.quantity > book.stockQuantity) throw AppError.badRequest('Not enough stock');
  }

  return prisma.cartItem.update({ where: { id: itemId }, data: data as never });
}

export async function removeItem(userId: string, itemId: string) {
  const cart = await getOrCreateCart(userId);
  const item = await prisma.cartItem.findFirst({ where: { id: itemId, cartId: cart.id } });
  if (!item) throw AppError.notFound('CartItem');
  await prisma.cartItem.delete({ where: { id: itemId } });
}
