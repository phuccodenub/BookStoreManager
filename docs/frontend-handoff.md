# Frontend Handoff Map

This document maps the current backend contract to the frontend areas described in the product spec.

## Public pages

- Home page:
  - `GET /api/home`
  - `GET /api/banners`
  - `GET /api/settings`
- Catalog/search page:
  - `GET /api/books`
  - `GET /api/categories`
  - `GET /api/authors`
  - `GET /api/publishers`
  - `GET /api/metadata/enums`
- Book detail page:
  - `GET /api/books/:id`
  - `GET /api/books/:id/related`
  - `GET /api/books/:bookId/reviews`
- Contact page:
  - `POST /api/contacts`

## Customer pages

- Auth:
  - `POST /api/auth/register`
  - `POST /api/auth/login`
  - `POST /api/auth/refresh`
  - `POST /api/auth/logout`
  - `POST /api/auth/forgot-password`
  - `POST /api/auth/reset-password`
  - `POST /api/auth/change-password`
- Profile and address book:
  - `GET /api/users/me`
  - `PATCH /api/users/me`
  - `POST /api/users/me/avatar`
  - `GET /api/addresses`
  - `POST /api/addresses`
  - `PATCH /api/addresses/:id`
  - `DELETE /api/addresses/:id`
- Cart and wishlist:
  - `GET /api/cart`
  - `POST /api/cart/items`
  - `PATCH /api/cart/items/:id`
  - `DELETE /api/cart/items/:id`
  - `GET /api/wishlist`
  - `POST /api/wishlist/:bookId`
  - `DELETE /api/wishlist/:bookId`
- Voucher and checkout:
  - `POST /api/vouchers/validate`
  - `POST /api/orders`
  - `GET /api/orders/me`
  - `GET /api/orders/me/:id`
  - `PATCH /api/orders/me/:id/cancel`
  - `GET /api/payments/:orderId`
- Reviews:
  - `POST /api/reviews`
  - `POST /api/books/:bookId/reviews`
  - `PATCH /api/reviews/:id`
  - `DELETE /api/reviews/:id`

## Admin and staff pages

- Catalog management:
  - `POST/PATCH/DELETE /api/categories/:id?`
  - `POST/PATCH/DELETE /api/authors/:id?`
  - `POST/PATCH/DELETE /api/publishers/:id?`
  - `POST/PATCH/DELETE /api/books/:id?`
  - `POST /api/books/:id/cover`
  - `POST /api/books/:id/images`
  - `DELETE /api/books/:id/images/:imageId`
- User and settings management:
  - `GET /api/users`
  - `GET /api/users/:id`
  - `POST /api/users`
  - `PATCH /api/users/:id`
  - `PATCH /api/users/:id/status`
  - `GET /api/settings`
  - `PATCH /api/settings`
- Orders and payments:
  - `GET /api/orders`
  - `GET /api/orders/:id`
  - `PATCH /api/orders/:id/status`
  - `GET /api/orders/:id/invoice`
  - `GET /api/orders/:id/delivery-note`
  - `GET /api/payments/:orderId`
- Inventory:
  - `GET /api/inventory`
  - `GET /api/inventory/transactions`
  - `POST /api/inventory/import`
  - `POST /api/inventory/export`
  - `POST /api/inventory/adjustment`
- Vouchers:
  - `GET /api/vouchers`
  - `GET /api/vouchers/:id`
  - `POST /api/vouchers`
  - `PATCH /api/vouchers/:id`
  - `DELETE /api/vouchers/:id`
- Contacts and reporting:
  - `GET /api/contacts`
  - `GET /api/contacts/:id`
  - `PATCH /api/contacts/:id`
  - `DELETE /api/contacts/:id`
  - `GET /api/reports/dashboard`
  - `GET /api/reports/revenue`
  - `GET /api/reports/best-sellers`
  - `GET /api/reports/inventory`
  - `GET /api/reports/cancelled`
  - `GET /api/reports/top-customers`
  - `GET /api/activity-logs`

## Socket contract

- Auth:
  - Send bearer access token in `handshake.auth.token` or `Authorization: Bearer <token>`
- Main events:
  - `order:created`
  - `order:updated`
  - `order:statusChanged`
  - `payment:updated`
  - `payment:success`
  - `inventory:low-stock`
  - `notification:new`

## Frontend bootstrap checklist

- Run Docker Compose for PostgreSQL
- Use `127.0.0.1:5433` in `DATABASE_URL` on Windows/Docker Desktop setups
- Copy `.env.example` to `.env`
- Run migrations and seed
- Login with demo accounts from README
- Use `/api-docs` for request/response examples
