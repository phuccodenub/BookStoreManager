import type { Express } from 'express';
import swaggerUi from 'swagger-ui-express';
import { env } from '../config/index.js';

const swaggerDocument = {
  openapi: '3.0.3',
  info: {
    title: 'BookStoreManager API',
    version: '1.0.0',
    description: 'REST API for a book-store e-commerce backend.',
  },
  tags: [
    { name: 'Health', description: 'Service health and connectivity' },
    { name: 'Auth', description: 'Authentication and token lifecycle' },
    { name: 'Orders', description: 'Customer and staff order flows' },
    { name: 'Payments', description: 'Mock online payment webhook' },
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
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: {
            type: 'object',
            properties: {
              code: { type: 'string' },
              message: { type: 'string' },
              details: {},
              requestId: { type: 'string', nullable: true },
            },
          },
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
    },
  },
  paths: {
    '/api/health': {
      get: {
        tags: ['Health'],
        summary: 'Check service health',
        responses: {
          '200': {
            description: 'Health status',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SuccessResponse' },
              },
            },
          },
        },
      },
    },
    '/api/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Authenticate a user',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/LoginRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Authenticated successfully',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/SuccessResponse' },
                    {
                      type: 'object',
                      properties: {
                        data: { $ref: '#/components/schemas/LoginResponse' },
                      },
                    },
                  ],
                },
              },
            },
          },
          '401': { description: 'Invalid credentials' },
        },
      },
    },
    '/api/auth/refresh': {
      post: {
        tags: ['Auth'],
        summary: 'Rotate access and refresh token',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/RefreshRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Tokens refreshed successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SuccessResponse' },
              },
            },
          },
        },
      },
    },
    '/api/orders': {
      post: {
        tags: ['Orders'],
        summary: 'Create a customer order from selected cart items',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateOrderRequest' },
            },
          },
        },
        responses: {
          '201': {
            description: 'Order created successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SuccessResponse' },
              },
            },
          },
        },
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
        responses: {
          '200': {
            description: 'Order list',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SuccessResponse' },
              },
            },
          },
        },
      },
    },
    '/api/orders/me': {
      get: {
        tags: ['Orders'],
        summary: 'List current customer orders',
        security: [{ BearerAuth: [] }],
        parameters: [
          { in: 'query', name: 'page', schema: { type: 'integer', default: 1 } },
          { in: 'query', name: 'limit', schema: { type: 'integer', default: 20 } },
          { in: 'query', name: 'status', schema: { type: 'string' } },
        ],
        responses: {
          '200': {
            description: 'Order history',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SuccessResponse' },
              },
            },
          },
        },
      },
    },
    '/api/orders/{id}/status': {
      patch: {
        tags: ['Orders'],
        summary: 'Update order status as staff/admin',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateOrderStatusRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Order status updated',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SuccessResponse' },
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
        parameters: [
          {
            in: 'header',
            name: 'x-webhook-secret',
            required: true,
            schema: { type: 'string' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/PaymentWebhookRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Webhook accepted',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SuccessResponse' },
              },
            },
          },
          '401': { description: 'Invalid webhook secret' },
        },
      },
    },
  },
};

export function setupSwagger(app: Express): void {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
}
