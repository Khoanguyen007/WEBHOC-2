const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'WEBHOC API',
      version: '2.0.0',
      description: 'Online Learning Platform API',
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
    ],
  },
  apis: ['./routes/*.js'], // path to the API docs
};

const qrPaymentDocs = {
  paths: {
    '/api/v2/payments/qr/generate': {
      post: {
        summary: 'Tạo QR code thanh toán',
        description: 'Tạo QR code qua VietQR QuickLink để thanh toán khóa học',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  courseId: {
                    type: 'string',
                    description: 'ID của khóa học'
                  }
                },
                required: ['courseId']
              }
            }
          }
        },
        responses: {
          200: {
            description: 'QR code tạo thành công',
            content: {
              'application/json': {
                example: {
                  statusCode: 200,
                  data: {
                    qrCodeUrl: 'https://img.vietqr.io/image/MB-9876543210-compact.jpg',
                    transactionRef: 'WEBHOC1700000000001',
                    amount: 1000000,
                    bankName: 'Ngân hàng Quân đội',
                    accountNumber: '9876543210',
                    accountName: 'WEBHOC LEARNING',
                    expiresIn: 30
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/v2/payments/qr/history': {
      get: {
        summary: 'Lịch sử thanh toán QR',
        description: 'Xem lịch sử các giao dịch QR của người dùng',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'page',
            in: 'query',
            schema: { type: 'integer', default: 1 }
          },
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'integer', default: 20 }
          },
          {
            name: 'status',
            in: 'query',
            schema: { 
              type: 'string',
              enum: ['pending', 'completed', 'failed', 'expired']
            }
          }
        ]
      }
    }
  }
};

const specs = swaggerJsdoc(options);

module.exports = { swaggerUi, specs };