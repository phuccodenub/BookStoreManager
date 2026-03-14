import type { Express } from 'express';
import swaggerUi from 'swagger-ui-express';
import { env } from '../config/index.js';

const swaggerDocument = {
  openapi: '3.0.3',
  info: {
    title: 'BookStoreManager API',
    version: '1.0.0',
    description: 'REST API for the BookStoreManager backend, prepared for frontend integration.',
  },
  tags: [
    { name: 'Health', description: 'Service health and connectivity' },
    { name: 'Auth', description: 'Authentication and token lifecycle' },
    { name: 'Home', description: 'Public home page aggregates' },
    { name: 'Settings', description: 'Public store settings and admin configuration' },
    { name: 'Metadata', description: 'Enum and helper data for frontend forms' },
    { name: 'Users', description: 'Authenticated profile endpoints' },
    { name: 'Addresses', description: 'Customer address book' },
    { name: 'Books', description: 'Catalog, detail, and related books' },
    { name: 'Cart', description: 'Customer cart management' },
    { name: 'Wishlist', description: 'Customer wishlist' },
    { name: 'Vouchers', description: 'Voucher validation and management' },
    { name: 'Orders', description: 'Customer and staff order flows' },
    { name: 'Payments', description: 'Payment lookup and mock webhook' },
    { name: 'Reviews', description: 'Public and authenticated review flows' },
    { name: 'Inventory', description: 'Inventory transaction management' },
    { name: 'Contacts', description: 'Public contacts and admin handling' },
    { name: 'Documents', description: 'Generated order PDFs' },
  ],
  servers: [
    { url: env.APP_BASE_URL, description: 'Local development' },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      SuccessResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string' },
          data: {},
          meta: { type: 'object', nullable: true },
        },
      },
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string' },
        },
      },
      LoginResponse: {
        type: 'object',
        properties: {
          accessToken: { type: 'string' },
          refreshToken: { type: 'string' },
          user: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              fullName: { type: 'string' },
              email: { type: 'string', format: 'email' },
              role: { type: 'string', enum: ['customer', 'staff', 'admin'] },
            },
          },
        },
      },
      RefreshRequest: {
        type: 'object',
        required: ['refreshToken'],
        properties: {
          refreshToken: { type: 'string' },
        },
      },
      UpdateProfileRequest: {
        type: 'object',
        properties: {
          fullName: { type: 'string' },
          phone: { type: 'string' },
        },
      },
      AddressRequest: {
        type: 'object',
        required: ['receiverName', 'receiverPhone', 'province', 'district', 'ward', 'detailAddress'],
        properties: {
          receiverName: { type: 'string' },
          receiverPhone: { type: 'string' },
          province: { type: 'string' },
          district: { type: 'string' },
          ward: { type: 'string' },
          detailAddress: { type: 'string' },
          isDefault: { type: 'boolean' },
        },
      },
      CartAddItemRequest: {
        type: 'object',
        required: ['bookId'],
        properties: {
          bookId: { type: 'string', format: 'uuid' },
          quantity: { type: 'integer', minimum: 1 },
        },
      },
      CartUpdateItemRequest: {
        type: 'object',
        properties: {
          quantity: { type: 'integer', minimum: 1 },
          selected: { type: 'boolean' },
        },
      },
      VoucherValidateRequest: {
        type: 'object',
        required: ['code', 'orderSubtotal'],
        properties: {
          code: { type: 'string' },
          orderSubtotal: { type: 'number' },
        },
      },
      CreateOrderRequest: {
        type: 'object',
        required: ['addressId', 'paymentMethod'],
        properties: {
          addressId: { type: 'string', format: 'uuid' },
          paymentMethod: { type: 'string', enum: ['cod', 'online'] },
          voucherCode: { type: 'string' },
          note: { type: 'string' },
          cartItemIds: {
            type: 'array',
            items: { type: 'string', format: 'uuid' },
          },
        },
      },
      CancelOrderRequest: {
        type: 'object',
        required: ['cancelledReason'],
        properties: {
          cancelledReason: { type: 'string' },
        },
      },
      UpdateOrderStatusRequest: {
        type: 'object',
        required: ['orderStatus'],
        properties: {
          orderStatus: {
            type: 'string',
            enum: ['confirmed', 'packing', 'shipping', 'completed', 'cancelled'],
          },
          cancelledReason: { type: 'string' },
        },
      },
      PaymentWebhookRequest: {
        type: 'object',
        required: ['orderCode', 'transactionCode', 'amount', 'status'],
        properties: {
          orderCode: { type: 'string' },
          transactionCode: { type: 'string' },
          amount: { type: 'number' },
          status: { type: 'string', enum: ['paid', 'failed'] },
        },
      },
      PaymentLookupResponse: {
        type: 'object',
        properties: {
          orderId: { type: 'string', format: 'uuid' },
          orderCode: { type: 'string' },
          paymentMethod: { type: 'string', enum: ['cod', 'online'] },
          paymentStatus: { type: 'string', enum: ['unpaid', 'pending', 'paid', 'failed', 'refunded'] },
          totalAmount: { type: 'string', example: '125000' },
          payment: {
            nullable: true,
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              provider: { type: 'string' },
              transactionCode: { type: 'string', nullable: true },
              amount: { type: 'string', example: '125000' },
              status: { type: 'string' },
              paidAt: { type: 'string', format: 'date-time', nullable: true },
            },
          },
        },
      },
      SettingsUpdateRequest: {
        type: 'object',
        properties: {
          storeName: { type: 'string' },
          contactEmail: { type: 'string', format: 'email', nullable: true },
          contactPhone: { type: 'string', nullable: true },
          contactAddress: { type: 'string', nullable: true },
          shippingFee: { type: 'number' },
          supportHours: { type: 'string', nullable: true },
          paymentProviderName: { type: 'string', nullable: true },
          paymentInstructions: { type: 'string', nullable: true },
        },
      },
      ReviewCreateByBookRequest: {
        type: 'object',
        required: ['orderId', 'rating'],
        properties: {
          orderId: { type: 'string', format: 'uuid' },
          rating: { type: 'integer', minimum: 1, maximum: 5 },
          comment: { type: 'string' },
        },
      },
      ReviewUpdateRequest: {
        type: 'object',
        properties: {
          rating: { type: 'integer', minimum: 1, maximum: 5 },
          comment: { type: 'string' },
        },
      },
      InventoryImportRequest: {
        type: 'object',
        required: ['bookId', 'quantity'],
        properties: {
          bookId: { type: 'string', format: 'uuid' },
          quantity: { type: 'integer', minimum: 1 },
          unitCost: { type: 'number' },
          note: { type: 'string' },
        },
      },
      InventoryAdjustmentRequest: {
        type: 'object',
        required: ['bookId', 'quantity'],
        properties: {
          bookId: { type: 'string', format: 'uuid' },
          quantity: { type: 'integer' },
          unitCost: { type: 'number' },
          note: { type: 'string' },
        },
      },
      ContactCreateRequest: {
        type: 'object',
        required: ['customerName', 'email', 'subject', 'content'],
        properties: {
          customerName: { type: 'string' },
          email: { type: 'string', format: 'email' },
          phone: { type: 'string' },
          subject: { type: 'string' },
          content: { type: 'string' },
        },
      },
    },
  },
  paths: {
    '/api/health': {
      get: {
        tags: ['Health'],
        summary: 'Check service health',
        responses: {
          '200': { description: 'Health status', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } },
        },
      },
    },
    '/api/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Authenticate a user',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginRequest' } } } },
        responses: {
          '200': {
            description: 'Authenticated successfully',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/SuccessResponse' },
                    { type: 'object', properties: { data: { $ref: '#/components/schemas/LoginResponse' } } },
                  ],
                },
              },
            },
          },
        },
      },
    },
    '/api/auth/refresh': {
      post: {
        tags: ['Auth'],
        summary: 'Rotate access and refresh token',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/RefreshRequest' } } } },
        responses: {
          '200': { description: 'Tokens refreshed successfully', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } },
        },
      },
    },
    '/api/home': {
      get: {
        tags: ['Home'],
        summary: 'Get home page aggregates for banners and highlighted books',
        parameters: [
          { in: 'query', name: 'limit', schema: { type: 'integer', default: 8, minimum: 1, maximum: 20 } },
        ],
        responses: {
          '200': { description: 'Home page data', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } },
        },
      },
    },
    '/api/settings': {
      get: {
        tags: ['Settings'],
        summary: 'Get public store settings for the frontend shell',
        responses: {
          '200': { description: 'Store settings', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } },
        },
      },
      patch: {
        tags: ['Settings'],
        summary: 'Update store settings as admin',
        security: [{ BearerAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/SettingsUpdateRequest' } } } },
        responses: {
          '200': { description: 'Updated settings', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } },
        },
      },
    },
    '/api/metadata/enums': {
      get: {
        tags: ['Metadata'],
        summary: 'Get enums and helper options for frontend forms',
        responses: {
          '200': { description: 'Enum metadata', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } },
        },
      },
    },
    '/api/users/me': {
      get: {
        tags: ['Users'],
        summary: 'Get the authenticated user profile',
        security: [{ BearerAuth: [] }],
        responses: { '200': { description: 'Profile', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } } },
      },
      patch: {
        tags: ['Users'],
        summary: 'Update the authenticated user profile',
        security: [{ BearerAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateProfileRequest' } } } },
        responses: { '200': { description: 'Updated profile', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } } },
      },
    },
    '/api/addresses': {
      get: {
        tags: ['Addresses'],
        summary: 'List addresses for the authenticated customer',
        security: [{ BearerAuth: [] }],
        responses: { '200': { description: 'Address list', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } } },
      },
      post: {
        tags: ['Addresses'],
        summary: 'Create a customer address',
        security: [{ BearerAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/AddressRequest' } } } },
        responses: { '201': { description: 'Created address', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } } },
      },
    },
    '/api/addresses/{id}': {
      patch: {
        tags: ['Addresses'],
        summary: 'Update a customer address',
        security: [{ BearerAuth: [] }],
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/AddressRequest' } } } },
        responses: { '200': { description: 'Updated address', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } } },
      },
      delete: {
        tags: ['Addresses'],
        summary: 'Delete a customer address',
        security: [{ BearerAuth: [] }],
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { '204': { description: 'Address removed' } },
      },
    },
    '/api/books': {
      get: {
        tags: ['Books'],
        summary: 'List books with filters for public catalog pages',
        parameters: [
          { in: 'query', name: 'page', schema: { type: 'integer', default: 1 } },
          { in: 'query', name: 'limit', schema: { type: 'integer', default: 12 } },
          { in: 'query', name: 'search', schema: { type: 'string' } },
          { in: 'query', name: 'categoryId', schema: { type: 'string', format: 'uuid' } },
          { in: 'query', name: 'authorId', schema: { type: 'string', format: 'uuid' } },
          { in: 'query', name: 'publisherId', schema: { type: 'string', format: 'uuid' } },
          { in: 'query', name: 'status', schema: { type: 'string' } },
          { in: 'query', name: 'isFeatured', schema: { type: 'boolean' } },
          { in: 'query', name: 'isNew', schema: { type: 'boolean' } },
          { in: 'query', name: 'isBestSeller', schema: { type: 'boolean' } },
          { in: 'query', name: 'minPrice', schema: { type: 'number' } },
          { in: 'query', name: 'maxPrice', schema: { type: 'number' } },
          { in: 'query', name: 'sortBy', schema: { type: 'string', enum: ['price_asc', 'price_desc', 'newest', 'best_seller'] } },
        ],
        responses: { '200': { description: 'Book list', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } } },
      },
    },
    '/api/books/{id}': {
      get: {
        tags: ['Books'],
        summary: 'Get a book detail by id',
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { '200': { description: 'Book detail', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } } },
      },
    },
    '/api/books/{id}/related': {
      get: {
        tags: ['Books'],
        summary: 'Get related books for a detail page',
        parameters: [
          { in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } },
          { in: 'query', name: 'limit', schema: { type: 'integer', default: 8, minimum: 1, maximum: 20 } },
        ],
        responses: { '200': { description: 'Related books', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } } },
      },
    },
    '/api/books/{bookId}/reviews': {
      get: {
        tags: ['Reviews'],
        summary: 'List reviews for a book',
        parameters: [
          { in: 'path', name: 'bookId', required: true, schema: { type: 'string', format: 'uuid' } },
          { in: 'query', name: 'page', schema: { type: 'integer', default: 1 } },
          { in: 'query', name: 'limit', schema: { type: 'integer', default: 20 } },
        ],
        responses: { '200': { description: 'Review list', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } } },
      },
      post: {
        tags: ['Reviews'],
        summary: 'Create a review for a specific book',
        security: [{ BearerAuth: [] }],
        parameters: [{ in: 'path', name: 'bookId', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/ReviewCreateByBookRequest' } } } },
        responses: { '201': { description: 'Created review', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } } },
      },
    },
    '/api/reviews/{id}': {
      patch: {
        tags: ['Reviews'],
        summary: 'Update a review as owner or admin',
        security: [{ BearerAuth: [] }],
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/ReviewUpdateRequest' } } } },
        responses: { '200': { description: 'Updated review', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } } },
      },
      delete: {
        tags: ['Reviews'],
        summary: 'Delete a review as owner or admin',
        security: [{ BearerAuth: [] }],
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { '204': { description: 'Review removed' } },
      },
    },
    '/api/cart': {
      get: {
        tags: ['Cart'],
        summary: 'Get the authenticated customer cart',
        security: [{ BearerAuth: [] }],
        responses: { '200': { description: 'Cart data', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } } },
      },
    },
    '/api/cart/items': {
      post: {
        tags: ['Cart'],
        summary: 'Add a book to cart',
        security: [{ BearerAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CartAddItemRequest' } } } },
        responses: { '201': { description: 'Cart item added', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } } },
      },
    },
    '/api/cart/items/{id}': {
      patch: {
        tags: ['Cart'],
        summary: 'Update quantity or selection for a cart item',
        security: [{ BearerAuth: [] }],
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CartUpdateItemRequest' } } } },
        responses: { '200': { description: 'Updated cart item', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } } },
      },
      delete: {
        tags: ['Cart'],
        summary: 'Remove a cart item',
        security: [{ BearerAuth: [] }],
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { '204': { description: 'Cart item removed' } },
      },
    },
    '/api/wishlist': {
      get: {
        tags: ['Wishlist'],
        summary: 'List wishlist items for the authenticated customer',
        security: [{ BearerAuth: [] }],
        parameters: [
          { in: 'query', name: 'page', schema: { type: 'integer', default: 1 } },
          { in: 'query', name: 'limit', schema: { type: 'integer', default: 20 } },
        ],
        responses: { '200': { description: 'Wishlist items', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } } },
      },
    },
    '/api/wishlist/{bookId}': {
      post: {
        tags: ['Wishlist'],
        summary: 'Add a book to wishlist',
        security: [{ BearerAuth: [] }],
        parameters: [{ in: 'path', name: 'bookId', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { '201': { description: 'Wishlist item added', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } } },
      },
      delete: {
        tags: ['Wishlist'],
        summary: 'Remove a book from wishlist',
        security: [{ BearerAuth: [] }],
        parameters: [{ in: 'path', name: 'bookId', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { '204': { description: 'Wishlist item removed' } },
      },
    },
    '/api/vouchers/validate': {
      post: {
        tags: ['Vouchers'],
        summary: 'Validate a voucher for checkout',
        security: [{ BearerAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/VoucherValidateRequest' } } } },
        responses: { '200': { description: 'Voucher validation result', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } } },
      },
    },
    '/api/orders': {
      post: {
        tags: ['Orders'],
        summary: 'Create a customer order from selected cart items',
        security: [{ BearerAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateOrderRequest' } } } },
        responses: { '201': { description: 'Order created successfully', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } } },
      },
      get: {
        tags: ['Orders'],
        summary: 'List all orders for staff/admin',
        security: [{ BearerAuth: [] }],
        parameters: [
          { in: 'query', name: 'page', schema: { type: 'integer', default: 1 } },
          { in: 'query', name: 'limit', schema: { type: 'integer', default: 20 } },
          { in: 'query', name: 'status', schema: { type: 'string' } },
          { in: 'query', name: 'search', schema: { type: 'string' } },
          { in: 'query', name: 'userId', schema: { type: 'string', format: 'uuid' } },
        ],
        responses: { '200': { description: 'Order list', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } } },
      },
    },
    '/api/orders/me': {
      get: {
        tags: ['Orders'],
        summary: 'List orders for the authenticated customer',
        security: [{ BearerAuth: [] }],
        parameters: [
          { in: 'query', name: 'page', schema: { type: 'integer', default: 1 } },
          { in: 'query', name: 'limit', schema: { type: 'integer', default: 20 } },
          { in: 'query', name: 'status', schema: { type: 'string' } },
        ],
        responses: { '200': { description: 'Customer order list', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } } },
      },
    },
    '/api/orders/me/{id}': {
      get: {
        tags: ['Orders'],
        summary: 'Get a single customer order',
        security: [{ BearerAuth: [] }],
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { '200': { description: 'Order detail', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } } },
      },
    },
    '/api/orders/me/{id}/cancel': {
      patch: {
        tags: ['Orders'],
        summary: 'Cancel a pending customer order',
        security: [{ BearerAuth: [] }],
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CancelOrderRequest' } } } },
        responses: { '200': { description: 'Cancelled order', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } } },
      },
    },
    '/api/orders/{id}/status': {
      patch: {
        tags: ['Orders'],
        summary: 'Update order status as staff/admin',
        security: [{ BearerAuth: [] }],
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateOrderStatusRequest' } } } },
        responses: { '200': { description: 'Order status updated', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } } },
      },
    },
    '/api/orders/{id}/invoice': {
      get: {
        tags: ['Documents'],
        summary: 'Download an invoice PDF for an order',
        security: [{ BearerAuth: [] }],
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { '200': { description: 'Invoice PDF', content: { 'application/pdf': { schema: { type: 'string', format: 'binary' } } } } },
      },
    },
    '/api/orders/{id}/delivery-note': {
      get: {
        tags: ['Documents'],
        summary: 'Download a delivery note PDF for an order',
        security: [{ BearerAuth: [] }],
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { '200': { description: 'Delivery note PDF', content: { 'application/pdf': { schema: { type: 'string', format: 'binary' } } } } },
      },
    },
    '/api/payments/{orderId}': {
      get: {
        tags: ['Payments'],
        summary: 'Get payment details by order id',
        security: [{ BearerAuth: [] }],
        parameters: [{ in: 'path', name: 'orderId', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          '200': {
            description: 'Payment details',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/SuccessResponse' },
                    { type: 'object', properties: { data: { $ref: '#/components/schemas/PaymentLookupResponse' } } },
                  ],
                },
              },
            },
          },
        },
      },
    },
    '/api/payments/webhook': {
      post: {
        tags: ['Payments'],
        summary: 'Receive mock payment gateway updates',
        parameters: [{ in: 'header', name: 'x-webhook-secret', required: true, schema: { type: 'string' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/PaymentWebhookRequest' } } } },
        responses: { '200': { description: 'Webhook accepted', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } } },
      },
    },
    '/api/inventory': {
      get: {
        tags: ['Inventory'],
        summary: 'List inventory transactions',
        security: [{ BearerAuth: [] }],
        parameters: [
          { in: 'query', name: 'page', schema: { type: 'integer', default: 1 } },
          { in: 'query', name: 'limit', schema: { type: 'integer', default: 20 } },
          { in: 'query', name: 'bookId', schema: { type: 'string', format: 'uuid' } },
          { in: 'query', name: 'type', schema: { type: 'string' } },
        ],
        responses: { '200': { description: 'Inventory transactions', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } } },
      },
    },
    '/api/inventory/transactions': {
      get: {
        tags: ['Inventory'],
        summary: 'Alias for listing inventory transactions',
        security: [{ BearerAuth: [] }],
        parameters: [
          { in: 'query', name: 'page', schema: { type: 'integer', default: 1 } },
          { in: 'query', name: 'limit', schema: { type: 'integer', default: 20 } },
          { in: 'query', name: 'bookId', schema: { type: 'string', format: 'uuid' } },
          { in: 'query', name: 'type', schema: { type: 'string' } },
        ],
        responses: { '200': { description: 'Inventory transactions', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } } },
      },
    },
    '/api/inventory/import': {
      post: {
        tags: ['Inventory'],
        summary: 'Create an inventory import transaction',
        security: [{ BearerAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/InventoryImportRequest' } } } },
        responses: { '201': { description: 'Import transaction created', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } } },
      },
    },
    '/api/inventory/export': {
      post: {
        tags: ['Inventory'],
        summary: 'Create an inventory export transaction',
        security: [{ BearerAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/InventoryImportRequest' } } } },
        responses: { '201': { description: 'Export transaction created', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } } },
      },
    },
    '/api/inventory/adjustment': {
      post: {
        tags: ['Inventory'],
        summary: 'Create an inventory adjustment transaction',
        security: [{ BearerAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/InventoryAdjustmentRequest' } } } },
        responses: { '201': { description: 'Adjustment transaction created', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } } },
      },
    },
    '/api/contacts': {
      post: {
        tags: ['Contacts'],
        summary: 'Submit a public contact request',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/ContactCreateRequest' } } } },
        responses: { '201': { description: 'Contact created', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } } },
      },
      get: {
        tags: ['Contacts'],
        summary: 'List contacts for staff/admin',
        security: [{ BearerAuth: [] }],
        parameters: [
          { in: 'query', name: 'page', schema: { type: 'integer', default: 1 } },
          { in: 'query', name: 'limit', schema: { type: 'integer', default: 20 } },
          { in: 'query', name: 'status', schema: { type: 'string' } },
          { in: 'query', name: 'search', schema: { type: 'string' } },
        ],
        responses: { '200': { description: 'Contact list', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } } },
      },
    },
  },
};

export function setupSwagger(app: Express): void {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
}
