const { env } = require('./env');

const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = env.CORS_ORIGINS === '*' ? ['*'] : env.CORS_ORIGINS.split(',').map((o) => o.trim());
    
    // Always allow these known domains
    allowedOrigins.push('https://oditech-odcrafts-frontend.vercel.app');
    allowedOrigins.push('http://localhost:5173');

    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-request-id'],
};

module.exports = { corsOptions };
