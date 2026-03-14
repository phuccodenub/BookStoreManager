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
  const categories = await Promise.all([
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
  await Promise.all([
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
  const authors = await Promise.all([
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
  const publishers = await Promise.all([
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
  const books = await Promise.all([
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
  await Promise.all([
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
  await Promise.all([
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
