# BookStoreManager Backend

Backend-only service for BookStoreManager, built with Express 5, TypeScript, Prisma, PostgreSQL, JWT auth, Socket.IO, and Zod.

## Features

- Auth with access token + rotating refresh token
- User profile, avatar upload, address book
- Catalog management for categories, authors, publishers, books, banners
- Cart, wishlist, vouchers, orders, reviews
- Fulfillment, inventory transactions, reports, contacts, activity logs
- Mock payment webhook with shared-secret protection
- Swagger UI at `/api-docs`

## Requirements

- Node.js 22+
- PostgreSQL

## Local Database Setup

If you want a quick local PostgreSQL without installing native binaries, use Docker Compose:

```bash
docker compose up -d postgres
```

To stop it:

```bash
docker compose down
```

If you want to reset local DB data completely:

```bash
docker compose down -v
docker compose up -d postgres
```

Make sure your `.env` `DATABASE_URL` credentials match `docker-compose.yml` (`POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`).

Create a dedicated local PostgreSQL database for the project:

```sql
CREATE DATABASE book_store_manager;
```

Recommended local connection string:

```env
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/book_store_manager?schema=public
```

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy environment file and update values:

```bash
cp .env.example .env
```

PowerShell also supports:

```powershell
Copy-Item .env.example .env
```

Minimum environment variables to review before starting:

- `DATABASE_URL`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `PAYMENT_WEBHOOK_SECRET`
- `APP_BASE_URL`
- `DEFAULT_SHIPPING_FEE`
- `LOW_STOCK_THRESHOLD`
- `DEBUG_LOG_RESET_TOKENS=false`

3. Apply schema to PostgreSQL. If you already use migrations:

```bash
npm run prisma:deploy
```

For local development without existing migrations history, you can use:

```bash
npm run prisma:migrate
```

4. Seed demo data:

```bash
npm run prisma:seed
```

5. Start the server:

```bash
npm run dev
```

## Smoke Check

After bootstrapping a clean database, verify:

- `GET /api/health`
- `GET /api-docs`
- Login with one of the seeded demo accounts
- `POST /api/payments/webhook` with a wrong `x-webhook-secret` is rejected

## Frontend Handoff

A screen-to-endpoint mapping for the upcoming frontend lives at [`docs/frontend-handoff.md`](docs/frontend-handoff.md).

Helpful frontend bootstrap endpoints:

- `GET /api/home`
- `GET /api/settings`
- `GET /api/metadata/enums`
- `GET /api/books/:id/related`
- `GET /api/books/:bookId/reviews`
- `GET /api/payments/:orderId`
- `GET /api/orders/:id/invoice`
- `GET /api/orders/:id/delivery-note`
## Validation Commands

```bash
npm test
npm run lint:types
npm run build
npx prisma validate
```

## Demo Accounts

- `admin@bookstore.com` / `Password123!`
- `staff@bookstore.com` / `Password123!`
- `customer@bookstore.com` / `Password123!`

## Important Environment Variables

- `DATABASE_URL`: PostgreSQL connection string
- `JWT_ACCESS_SECRET`: access-token signing secret
- `JWT_REFRESH_SECRET`: refresh-token signing secret
- `PAYMENT_WEBHOOK_SECRET`: shared secret required by `/api/payments/webhook`
- `APP_BASE_URL`: absolute base URL used for upload/public links
- `DEFAULT_SHIPPING_FEE`: default order shipping fee
- `LOW_STOCK_THRESHOLD`: threshold for low-stock socket notifications
- `DEBUG_LOG_RESET_TOKENS`: keep `false` outside short-lived local debugging

## Socket Authentication

Socket rooms are assigned from a verified JWT, not from client-provided room names.

- Send the access token in `handshake.auth.token`
- `Bearer <token>` in `Authorization` header also works

Server-managed rooms:

- `user:{userId}`
- `role:{role}`

Main emitted events:

- `order:created`
- `order:updated`
- `order:statusChanged`
- `payment:updated`
- `payment:success`
- `inventory:lowStock`
- `inventory:low-stock`
- `notification:new`

## Mock Payment Webhook

Request:

```http
POST /api/payments/webhook
x-webhook-secret: <PAYMENT_WEBHOOK_SECRET>
Content-Type: application/json
```

Body:

```json
{
  "orderCode": "ORD-20260314-ABCD1234",
  "transactionCode": "TX-001",
  "amount": 125000,
  "status": "paid"
}
```

## Project Scripts

- `npm run dev`: start development server
- `npm run build`: compile TypeScript to `dist`
- `npm run start`: run compiled server
- `npm run lint:types`: TypeScript type-check
- `npm test`: run Vitest suite
- `npm run prisma:seed`: seed demo data
- `npm run prisma:deploy`: apply migrations in deployment mode

## Current Notes

- Upload URLs are normalized for Windows and POSIX paths
- Password change/reset revokes existing refresh tokens
- Pending paid online orders cannot be cancelled by customers
- Online orders cannot be completed before payment succeeds

