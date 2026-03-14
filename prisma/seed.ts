import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database …');

  /* ───────── Users ───────── */
  const passwordHash = await bcrypt.hash('Password123!', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@bookstore.com' },
    update: {},
    create: {
      fullName: 'Admin User',
      email: 'admin@bookstore.com',
      phone: '0901000001',
      passwordHash,
      role: 'admin',
      status: 'active',
    },
  });

  const staff = await prisma.user.upsert({
    where: { email: 'staff@bookstore.com' },
    update: {},
    create: {
      fullName: 'Staff User',
      email: 'staff@bookstore.com',
      phone: '0901000002',
      passwordHash,
      role: 'staff',
      status: 'active',
    },
  });

  const customer = await prisma.user.upsert({
    where: { email: 'customer@bookstore.com' },
    update: {},
    create: {
      fullName: 'Customer User',
      email: 'customer@bookstore.com',
      phone: '0901000003',
      passwordHash,
      role: 'customer',
      status: 'active',
    },
  });

  /* ───────── System Config ───────── */
  await prisma.systemConfig.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      storeName: 'BookStoreManager',
      contactEmail: 'support@bookstore.com',
      contactPhone: '0280000000',
      contactAddress: '123 Nguyen Hue, District 1, Ho Chi Minh City',
      shippingFee: 25000,
      supportHours: '08:00 - 21:00 daily',
      paymentProviderName: 'Mock Gateway',
      paymentInstructions: 'Use COD or trigger the protected mock webhook for online payments.',
    },
  });
  /* ───────── Addresses ───────── */
  await prisma.address.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      userId: customer.id,
      receiverName: 'Customer User',
      receiverPhone: '0901000003',
      province: 'TP Hồ Chí Minh',
      district: 'Quận 1',
      ward: 'Phường Bến Nghé',
      detailAddress: '123 Lê Lợi',
      isDefault: true,
    },
  });

  /* ───────── Categories ───────── */
  const categories = await prisma.$transaction([
    prisma.category.upsert({
      where: { slug: 'van-hoc' },
      update: {},
      create: { name: 'Văn học', slug: 'van-hoc', description: 'Sách văn học trong nước và quốc tế' },
    }),
    prisma.category.upsert({
      where: { slug: 'kinh-te' },
      update: {},
      create: { name: 'Kinh tế', slug: 'kinh-te', description: 'Sách kinh tế, kinh doanh' },
    }),
    prisma.category.upsert({
      where: { slug: 'khoa-hoc' },
      update: {},
      create: { name: 'Khoa học', slug: 'khoa-hoc', description: 'Sách khoa học tự nhiên' },
    }),
    prisma.category.upsert({
      where: { slug: 'cong-nghe' },
      update: {},
      create: { name: 'Công nghệ', slug: 'cong-nghe', description: 'Sách công nghệ thông tin' },
    }),
    prisma.category.upsert({
      where: { slug: 'thieu-nhi' },
      update: {},
      create: { name: 'Thiếu nhi', slug: 'thieu-nhi', description: 'Sách dành cho thiếu nhi' },
    }),
  ]);

  /* ───────── Sub-categories ───────── */
  await prisma.$transaction([
    prisma.category.upsert({
      where: { slug: 'tieu-thuyet' },
      update: {},
      create: { name: 'Tiểu thuyết', slug: 'tieu-thuyet', parentId: categories[0]!.id },
    }),
    prisma.category.upsert({
      where: { slug: 'tho-ca' },
      update: {},
      create: { name: 'Thơ ca', slug: 'tho-ca', parentId: categories[0]!.id },
    }),
  ]);

  /* ───────── Authors ───────── */
  const authors = await prisma.$transaction([
    prisma.author.upsert({
      where: { id: '00000000-0000-0000-0000-000000000011' },
      update: {},
      create: { id: '00000000-0000-0000-0000-000000000011', name: 'Nguyễn Nhật Ánh', bio: 'Nhà văn nổi tiếng với các tác phẩm thiếu nhi' },
    }),
    prisma.author.upsert({
      where: { id: '00000000-0000-0000-0000-000000000012' },
      update: {},
      create: { id: '00000000-0000-0000-0000-000000000012', name: 'Dale Carnegie', bio: 'Tác giả sách kỹ năng sống nổi tiếng thế giới' },
    }),
    prisma.author.upsert({
      where: { id: '00000000-0000-0000-0000-000000000013' },
      update: {},
      create: { id: '00000000-0000-0000-0000-000000000013', name: 'Yuval Noah Harari', bio: 'Sử gia và tác giả sách khoa học phổ thông' },
    }),
  ]);

  /* ───────── Publishers ───────── */
  const publishers = await prisma.$transaction([
    prisma.publisher.upsert({
      where: { id: '00000000-0000-0000-0000-000000000021' },
      update: {},
      create: { id: '00000000-0000-0000-0000-000000000021', name: 'NXB Trẻ', address: 'TP HCM', phone: '02838225340', email: 'info@nxbtre.com.vn' },
    }),
    prisma.publisher.upsert({
      where: { id: '00000000-0000-0000-0000-000000000022' },
      update: {},
      create: { id: '00000000-0000-0000-0000-000000000022', name: 'NXB Kim Đồng', address: 'Hà Nội', phone: '02439434730', email: 'info@nxbkimdong.com.vn' },
    }),
    prisma.publisher.upsert({
      where: { id: '00000000-0000-0000-0000-000000000023' },
      update: {},
      create: { id: '00000000-0000-0000-0000-000000000023', name: 'NXB Tổng hợp TP HCM', address: 'TP HCM' },
    }),
  ]);

  /* ───────── Books ───────── */
  const books = await prisma.$transaction([
    prisma.book.upsert({
      where: { slug: 'mat-biec' },
      update: {},
      create: {
        title: 'Mắt Biếc',
        slug: 'mat-biec',
        isbn: '9786041099074',
        description: 'Tiểu thuyết nổi tiếng của Nguyễn Nhật Ánh',
        price: 95000,
        importPrice: 60000,
        stockQuantity: 100,
        soldQuantity: 350,
        categoryId: categories[0]!.id,
        authorId: authors[0]!.id,
        publisherId: publishers[0]!.id,
        isFeatured: true,
        isBestSeller: true,
        pageCount: 200,
        publicationYear: 2019,
      },
    }),
    prisma.book.upsert({
      where: { slug: 'toi-thay-hoa-vang-tren-co-xanh' },
      update: {},
      create: {
        title: 'Tôi Thấy Hoa Vàng Trên Cỏ Xanh',
        slug: 'toi-thay-hoa-vang-tren-co-xanh',
        isbn: '9786041025301',
        description: 'Câu chuyện tuổi thơ đồng quê xúc động',
        price: 85000,
        importPrice: 55000,
        stockQuantity: 80,
        soldQuantity: 280,
        categoryId: categories[0]!.id,
        authorId: authors[0]!.id,
        publisherId: publishers[0]!.id,
        isFeatured: true,
        isNew: true,
        pageCount: 378,
        publicationYear: 2020,
      },
    }),
    prisma.book.upsert({
      where: { slug: 'dac-nhan-tam' },
      update: {},
      create: {
        title: 'Đắc Nhân Tâm',
        slug: 'dac-nhan-tam',
        isbn: '9786045890363',
        description: 'Cuốn sách kinh điển về kỹ năng giao tiếp',
        price: 68000,
        importPrice: 40000,
        stockQuantity: 150,
        soldQuantity: 500,
        categoryId: categories[1]!.id,
        authorId: authors[1]!.id,
        publisherId: publishers[2]!.id,
        isBestSeller: true,
        pageCount: 320,
        publicationYear: 2016,
      },
    }),
    prisma.book.upsert({
      where: { slug: 'sapiens-luoc-su-loai-nguoi' },
      update: {},
      create: {
        title: 'Sapiens: Lược Sử Loài Người',
        slug: 'sapiens-luoc-su-loai-nguoi',
        isbn: '9786045871867',
        description: 'Khám phá hành trình phát triển của loài người',
        price: 199000,
        importPrice: 130000,
        stockQuantity: 60,
        soldQuantity: 120,
        categoryId: categories[2]!.id,
        authorId: authors[2]!.id,
        publisherId: publishers[2]!.id,
        isNew: true,
        isFeatured: true,
        pageCount: 550,
        publicationYear: 2022,
      },
    }),
    prisma.book.upsert({
      where: { slug: 'clean-code' },
      update: {},
      create: {
        title: 'Clean Code',
        slug: 'clean-code',
        isbn: '9780132350884',
        description: 'A Handbook of Agile Software Craftsmanship',
        price: 350000,
        importPrice: 250000,
        stockQuantity: 4,
        soldQuantity: 45,
        categoryId: categories[3]!.id,
        publisherId: publishers[2]!.id,
        status: 'active',
        pageCount: 464,
        publicationYear: 2008,
      },
    }),
  ]);

  /* ───────── Vouchers ───────── */
  const now = new Date();
  await prisma.$transaction([
    prisma.voucher.upsert({
      where: { code: 'WELCOME10' },
      update: {},
      create: {
        code: 'WELCOME10',
        type: 'percent',
        value: 10,
        minOrderValue: 200000,
        maxDiscountValue: 50000,
        startDate: now,
        endDate: new Date(now.getFullYear() + 1, now.getMonth(), now.getDate()),
        usageLimit: 100,
      },
    }),
    prisma.voucher.upsert({
      where: { code: 'FREESHIP' },
      update: {},
      create: {
        code: 'FREESHIP',
        type: 'fixed',
        value: 25000,
        minOrderValue: 300000,
        startDate: now,
        endDate: new Date(now.getFullYear() + 1, now.getMonth(), now.getDate()),
        usageLimit: 50,
      },
    }),
  ]);

  /* ───────── Banners ───────── */
  await prisma.$transaction([
    prisma.banner.upsert({
      where: { id: '00000000-0000-0000-0000-000000000031' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000031',
        title: 'Sách mới tháng 3',
        image: 'banners/banner-1.jpg',
        link: '/books?is_new=true',
        status: true,
        sortOrder: 1,
      },
    }),
    prisma.banner.upsert({
      where: { id: '00000000-0000-0000-0000-000000000032' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000032',
        title: 'Giảm giá sách best-seller',
        image: 'banners/banner-2.jpg',
        link: '/books?is_best_seller=true',
        status: true,
        sortOrder: 2,
      },
    }),
  ]);

  /* ───────── Cart for customer ───────── */
  const cart = await prisma.cart.upsert({
    where: { userId: customer.id },
    update: {},
    create: { userId: customer.id },
  });

  await prisma.cartItem.upsert({
    where: { cartId_bookId: { cartId: cart.id, bookId: books[0]!.id } },
    update: {},
    create: { cartId: cart.id, bookId: books[0]!.id, quantity: 2 },
  });

  await prisma.cartItem.upsert({
    where: { cartId_bookId: { cartId: cart.id, bookId: books[2]!.id } },
    update: {},
    create: { cartId: cart.id, bookId: books[2]!.id, quantity: 1 },
  });

  /* ───────── Wishlist ───────── */
  await prisma.wishlist.upsert({
    where: { userId_bookId: { userId: customer.id, bookId: books[3]!.id } },
    update: {},
    create: { userId: customer.id, bookId: books[3]!.id },
  });


  /* ───────── Orders / Payments / Reviews / Contacts ───────── */
  const addressSnapshot = 'Customer User, 0901000003, 123 Lê Lợi, Phường Bến Nghé, Quận 1, TP Hồ Chí Minh';

  await prisma.order.upsert({
    where: { orderCode: 'ORD-SEED-0001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000041',
      orderCode: 'ORD-SEED-0001',
      userId: customer.id,
      receiverName: 'Customer User',
      receiverPhone: '0901000003',
      addressSnapshot,
      paymentMethod: 'cod',
      paymentStatus: 'paid',
      orderStatus: 'completed',
      subtotal: 190000,
      shippingFee: 25000,
      discountAmount: 0,
      totalAmount: 215000,
      note: 'Completed seed order',
    },
  });

  await prisma.order.upsert({
    where: { orderCode: 'ORD-SEED-0002' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000042',
      orderCode: 'ORD-SEED-0002',
      userId: customer.id,
      receiverName: 'Customer User',
      receiverPhone: '0901000003',
      addressSnapshot,
      paymentMethod: 'online',
      paymentStatus: 'paid',
      orderStatus: 'shipping',
      subtotal: 199000,
      shippingFee: 25000,
      discountAmount: 0,
      totalAmount: 224000,
      note: 'Shipping seed order',
    },
  });

  await prisma.order.upsert({
    where: { orderCode: 'ORD-SEED-0003' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000043',
      orderCode: 'ORD-SEED-0003',
      userId: customer.id,
      receiverName: 'Customer User',
      receiverPhone: '0901000003',
      addressSnapshot,
      paymentMethod: 'online',
      paymentStatus: 'unpaid',
      orderStatus: 'pending',
      subtotal: 68000,
      shippingFee: 25000,
      discountAmount: 0,
      totalAmount: 93000,
      note: 'Pending seed order',
    },
  });

  await prisma.order.upsert({
    where: { orderCode: 'ORD-SEED-0004' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000044',
      orderCode: 'ORD-SEED-0004',
      userId: customer.id,
      receiverName: 'Customer User',
      receiverPhone: '0901000003',
      addressSnapshot,
      paymentMethod: 'cod',
      paymentStatus: 'unpaid',
      orderStatus: 'cancelled',
      subtotal: 85000,
      shippingFee: 25000,
      discountAmount: 0,
      totalAmount: 110000,
      cancelledReason: 'Customer changed mind',
      note: 'Cancelled seed order',
    },
  });

  await prisma.$transaction([
    prisma.orderItem.upsert({
      where: { id: '00000000-0000-0000-0000-000000000051' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000051',
        orderId: '00000000-0000-0000-0000-000000000041',
        bookId: books[0]!.id,
        bookNameSnapshot: books[0]!.title,
        quantity: 2,
        unitPrice: 95000,
        totalPrice: 190000,
      },
    }),
    prisma.orderItem.upsert({
      where: { id: '00000000-0000-0000-0000-000000000052' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000052',
        orderId: '00000000-0000-0000-0000-000000000042',
        bookId: books[3]!.id,
        bookNameSnapshot: books[3]!.title,
        quantity: 1,
        unitPrice: 199000,
        totalPrice: 199000,
      },
    }),
    prisma.orderItem.upsert({
      where: { id: '00000000-0000-0000-0000-000000000053' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000053',
        orderId: '00000000-0000-0000-0000-000000000043',
        bookId: books[2]!.id,
        bookNameSnapshot: books[2]!.title,
        quantity: 1,
        unitPrice: 68000,
        totalPrice: 68000,
      },
    }),
    prisma.orderItem.upsert({
      where: { id: '00000000-0000-0000-0000-000000000054' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000054',
        orderId: '00000000-0000-0000-0000-000000000044',
        bookId: books[1]!.id,
        bookNameSnapshot: books[1]!.title,
        quantity: 1,
        unitPrice: 85000,
        totalPrice: 85000,
      },
    }),
  ]);

  await prisma.$transaction([
    prisma.payment.upsert({
      where: { orderId: '00000000-0000-0000-0000-000000000041' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000061',
        orderId: '00000000-0000-0000-0000-000000000041',
        provider: 'cod',
        transactionCode: null,
        amount: 215000,
        status: 'paid',
        paidAt: new Date(),
      },
    }),
    prisma.payment.upsert({
      where: { orderId: '00000000-0000-0000-0000-000000000042' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000062',
        orderId: '00000000-0000-0000-0000-000000000042',
        provider: 'mock_gateway',
        transactionCode: 'TX-SEED-0002',
        amount: 224000,
        status: 'paid',
        paidAt: new Date(),
        rawResponse: { orderCode: 'ORD-SEED-0002', transactionCode: 'TX-SEED-0002', amount: 224000, status: 'paid' },
      },
    }),
  ]);

  await prisma.review.upsert({
    where: { id: '00000000-0000-0000-0000-000000000101' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000101',
      userId: customer.id,
      bookId: books[0]!.id,
      orderId: '00000000-0000-0000-0000-000000000041',
      rating: 5,
      comment: 'A great seed review for frontend demos.',
    },
  });

  await prisma.contact.upsert({
    where: { id: '00000000-0000-0000-0000-000000000111' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000111',
      customerName: 'Frontend Demo Customer',
      email: 'customer@bookstore.com',
      phone: '0901000003',
      subject: 'Shipping question',
      content: 'Can I receive this order during office hours?',
      status: 'in_progress',
      assignedTo: staff.id,
      note: 'Handled in seed data for admin/staff demo.',
    },
  });

  await prisma.$transaction([
    prisma.inventoryTransaction.upsert({
      where: { id: '00000000-0000-0000-0000-000000000121' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000121',
        bookId: books[4]!.id,
        type: 'import',
        quantity: 5,
        unitCost: 250000,
        note: 'Seed import transaction',
        createdBy: admin.id,
      },
    }),
    prisma.inventoryTransaction.upsert({
      where: { id: '00000000-0000-0000-0000-000000000122' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000122',
        bookId: books[3]!.id,
        type: 'order_confirm',
        quantity: -1,
        referenceType: 'order',
        referenceId: '00000000-0000-0000-0000-000000000042',
        note: 'Seed order confirmation transaction',
        createdBy: staff.id,
      },
    }),
  ]);

  await prisma.activityLog.upsert({
    where: { id: '00000000-0000-0000-0000-000000000131' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000131',
      userId: admin.id,
      action: 'seed_order_status_reviewed',
      entityType: 'order',
      entityId: '00000000-0000-0000-0000-000000000042',
      newData: { orderCode: 'ORD-SEED-0002', orderStatus: 'shipping', paymentStatus: 'paid' },
      ipAddress: '127.0.0.1',
    },
  });
  console.log('✅ Seed completed');
  console.log('   Accounts: admin@bookstore.com / staff@bookstore.com / customer@bookstore.com');
  console.log('   Password: Password123!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

