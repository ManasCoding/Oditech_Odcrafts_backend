const { env } = require('./env');

const origins =
  env.CORS_ORIGINS === '*'
    ? '*'
    : env.CORS_ORIGINS.split(',').map((o) => o.trim());

const corsOptions = {
  origin: origins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-request-id'],
};

module.exports = { corsOptions };
