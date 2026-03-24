import {
  Role,
  UserStatus,
  BookStatus,
  OrderStatus,
  PaymentStatus,
  PaymentMethod,
  VoucherType,
  InventoryTransactionType,
  ContactStatus,
  ORDER_STATUS_TRANSITIONS,
} from '../../shared/constants/index.js';

export function getEnums() {
  return {
    roles: Object.values(Role),
    userStatuses: Object.values(UserStatus),
    bookStatuses: Object.values(BookStatus),
    orderStatuses: Object.values(OrderStatus),
    paymentStatuses: Object.values(PaymentStatus),
    paymentMethods: Object.values(PaymentMethod),
    voucherTypes: Object.values(VoucherType),
    inventoryTransactionTypes: Object.values(InventoryTransactionType),
    contactStatuses: Object.values(ContactStatus),
    orderStatusTransitions: ORDER_STATUS_TRANSITIONS,
    bookSortOptions: [
      { value: 'price_asc', label: 'Giá tăng dần' },
      { value: 'price_desc', label: 'Giá giảm dần' },
      { value: 'newest', label: 'Mới cập nhật' },
      { value: 'best_seller', label: 'Bán chạy' },
    ],
  };
}
