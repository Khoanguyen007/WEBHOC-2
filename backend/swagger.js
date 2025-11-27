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

const specs = swaggerJsdoc(options);

module.exports = { swaggerUi, specs };