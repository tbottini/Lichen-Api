module.exports = {
  swaggerDefinition: {
    info: {
      description:
        'Server Api for social network Lichen,  Mobile Application based on flutter/dart',
      title: 'Lichen',
      version: '0.1.0',
    },
    host: 'reseau-lichen.fr',
    basePath: '',
    produces: ['application/json'],
    schemes: ['http', 'https'],
    securityDefinitions: {
      JWT: {
        type: 'apiKey',
        in: 'header',
        name: 'Authorization',
        description: '',
      },
    },
  },
  basedir: __dirname,
  files: ['./route/*.ts'],
}
