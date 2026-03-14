export const Role = {
  CUSTOMER: 'customer',
  STAFF: 'staff',
  ADMIN: 'admin',
} as const;
export type Role = (typeof Role)[keyof typeof Role];

export const UserStatus = {
  ACTIVE: 'active',
  LOCKED: 'locked',
} as const;
export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus];

export const BookStatus = {
  ACTIVE: 'active',
  OUT_OF_STOCK: 'out_of_stock',
  DISCONTINUED: 'discontinued',
} as const;
export type BookStatus = (typeof BookStatus)[keyof typeof BookStatus];

export const OrderStatus = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PACKING: 'packing',
  SHIPPING: 'shipping',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;
export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];

export const PaymentStatus = {
  UNPAID: 'unpaid',
  PENDING: 'pending',
  PAID: 'paid',
  FAILED: 'failed',
  REFUNDED: 'refunded',
} as const;
export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];

export const PaymentMethod = {
  COD: 'cod',
  ONLINE: 'online',
} as const;
export type PaymentMethod = (typeof PaymentMethod)[keyof typeof PaymentMethod];

export const VoucherType = {
  PERCENT: 'percent',
  FIXED: 'fixed',
} as const;
export type VoucherType = (typeof VoucherType)[keyof typeof VoucherType];

export const InventoryTransactionType = {
  IMPORT: 'import',
  EXPORT: 'export',
  ADJUSTMENT: 'adjustment',
  ORDER_CONFIRM: 'order_confirm',
  ORDER_CANCEL: 'order_cancel',
} as const;
export type InventoryTransactionType = (typeof InventoryTransactionType)[keyof typeof InventoryTransactionType];

export const ContactStatus = {
  NEW: 'new',
  IN_PROGRESS: 'in_progress',
  RESOLVED: 'resolved',
} as const;
export type ContactStatus = (typeof ContactStatus)[keyof typeof ContactStatus];

/** Valid order status transitions */
export const ORDER_STATUS_TRANSITIONS: Record<string, string[]> = {
  [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
  [OrderStatus.CONFIRMED]: [OrderStatus.PACKING, OrderStatus.CANCELLED],
  [OrderStatus.PACKING]: [OrderStatus.SHIPPING, OrderStatus.CANCELLED],
  [OrderStatus.SHIPPING]: [OrderStatus.COMPLETED],
  [OrderStatus.COMPLETED]: [],
  [OrderStatus.CANCELLED]: [],
};
