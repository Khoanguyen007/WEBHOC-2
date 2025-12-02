const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

beforeAll(async () => {
  // Start in-memory MongoDB for testing
  mongoServer = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongoServer.getUri();
  process.env.JWT_SECRET = 'test-secret-key';
  process.env.REFRESH_TOKEN_SECRET = 'test-refresh-secret';
  process.env.NODE_ENV = 'test';
});

afterAll(async () => {
  if (mongoServer) {
    await mongoServer.stop();
  }
});

// Suppress console logs during tests
global.console.log = jest.fn();
global.console.error = jest.fn();
