const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Referral System API',
      version: '1.0.0',
      description: 'API for three-login system with referral codes',
    },
    servers: [
      {
        url: process.env.BASE_URL || 'http://localhost:3000',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            email: { type: 'string' },
            role: { type: 'string', enum: ['admin', 'student', 'partner'] },
            name: { type: 'string' },
          },
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password', 'role'],
          properties: {
            email: { type: 'string' },
            password: { type: 'string' },
            role: { type: 'string', enum: ['admin', 'student', 'partner'] },
          },
        },
        RegisterRequest: {
          type: 'object',
          required: ['email', 'password', 'role', 'name'],
          properties: {
            email: { type: 'string' },
            password: { type: 'string' },
            role: { type: 'string', enum: ['student', 'partner'] },
            name: { type: 'string' },
            studentId: { type: 'string' },
            course: { type: 'string' },
            year: { type: 'integer' },
            position: { type: 'string' },
            referralCode: { type: 'string' },
          },
        },
        ReferralCodeRequest: {
          type: 'object',
          required: ['partnerId'],
          properties: {
            partnerId: { type: 'integer' },
          },
        },
        VerifyReferralCodeRequest: {
          type: 'object',
          required: ['referralCode'],
          properties: {
            referralCode: { type: 'string', description: 'The referral code to verify' },
          },
        },
        TransactionRequest: {
          type: 'object',
          required: ['transactionId', 'studentName', 'code', 'className'],
          properties: {
            transactionId: { type: 'string', description: 'Unique identifier for the transaction' },
            studentName: { type: 'string', description: 'Name of the student involved in the transaction' },
            email: { type: 'string', format: 'email', description: 'Optional email of the student' },
            code: { type: 'string', description: 'Referral or promotional code used' },
            className: { type: 'string', description: 'Name of the class associated with the transaction' },
            amount: { type: 'number', format: 'double', description: 'Transaction amount' },
          },
          example: {
            transactionId: 'TXN123456789',
            studentName: 'John Doe',
            email: 'john.doe@example.com',
            code: 'REFERRAL2024',
            className: 'Advanced React',
            amount: 99.99,
          },
        },
      },
    },
    paths: {
      '/api/verify-referral': {
        post: {
          summary: 'Verify a referral code',
          tags: ['Referrals'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/VerifyReferralCodeRequest' },
              },
            },
          },
          responses: {
            200: {
              description: 'Referral code verification successful',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      valid: { type: 'boolean' },
                      message: { type: 'string' },
                      referralCodeDetails: {
                        type: 'object',
                        properties: {
                          id: { type: 'integer' },
                          partner_id: { type: 'integer' },
                          code: { type: 'string' },
                          expires_at: { type: 'string', format: 'date-time', nullable: true },
                          is_active: { type: 'boolean' },
                        },
                      },
                    },
                  },
                },
              },
            },
            400: { description: 'Invalid or expired referral code' },
            500: { description: 'Server error' },
          },
        },
      },
      '/api/auth/login': {
        post: {
          summary: 'User login',
          tags: ['Authentication'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/LoginRequest' },
              },
            },
          },
          responses: {
            200: {
              description: 'Login successful',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      token: { type: 'string' },
                      user: { $ref: '#/components/schemas/User' },
                    },
                  },
                },
              },
            },
            401: { description: 'Invalid credentials' },
          },
        },
      },
      '/api/auth/register': {
        post: {
          summary: 'Register new user (student/partner)',
          tags: ['Authentication'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/RegisterRequest' },
              },
            },
          },
          responses: {
            200: { description: 'Registration successful' },
            400: { description: 'Email already exists or invalid referral code' },
          },
        },
      },
      '/api/admin': {
        get: {
          summary: 'Get admin dashboard data',
          tags: ['Admin'],
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: 'Admin data' },
            401: { description: 'Unauthorized' },
          },
        },
      },
      '/api/admin/partners': {
        get: {
          summary: 'Get all partners',
          tags: ['Admin'],
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: 'List of partners' },
            401: { description: 'Unauthorized' },
          },
        },
      },
      '/api/admin/referral-codes': {
        get: {
          summary: 'Get all referral codes',
          tags: ['Admin'],
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: 'List of referral codes' },
            401: { description: 'Unauthorized' },
          },
        },
        post: {
          summary: 'Create referral code for partner',
          tags: ['Admin'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ReferralCodeRequest' },
              },
            },
          },
          responses: {
            200: { description: 'Referral code created' },
            400: { description: 'Partner already has a code or not found' },
            401: { description: 'Unauthorized' },
          },
        },
      },
      '/api/student': {
        get: {
          summary: 'Get student dashboard data',
          tags: ['Student'],
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: 'Student data' },
            401: { description: 'Unauthorized' },
          },
        },
      },
      '/api/partner': {
        get: {
          summary: 'Get partner dashboard data with referral stats',
          tags: ['Partner'],
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: 'Partner data with referral info' },
            401: { description: 'Unauthorized' },
          },
        },
      },
      '/api/save-transaction': {
        post: {
          summary: 'Save transaction details',
          tags: ['Transactions'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/TransactionRequest' },
              },
            },
          },
          responses: {
            200: {
              description: 'Transaction saved successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      message: { type: 'string' },
                      transaction: { $ref: '#/components/schemas/TransactionRequest' },
                    },
                  },
                },
              },
            },
            400: { description: 'Missing required fields' },
            500: { description: 'Internal Server Error' },
          },
        },
      },
    },
  },
  apis: [], // Set to an empty array to satisfy swagger-jsdoc requirements
};

const swaggerSpec = swaggerJsdoc(options);
const swaggerUiOptions = {
  swaggerOptions: {
    persistAuthorization: true,
    tryItOutEnabled: true,
  },
};

function setupSwagger(app) {
  // Serve the Swagger JSON specification
  app.get('/swagger-json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  // Serve Swagger UI
  app.use('/swagger', swaggerUi.serve, swaggerUi.setup(null, { ...swaggerUiOptions, swaggerUrl: '/swagger-json' }));
}

module.exports = {
  setupSwagger,
  swaggerSpec,
  swaggerUiOptions,
};