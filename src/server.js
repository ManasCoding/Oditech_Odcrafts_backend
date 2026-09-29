const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const cookieParser = require('cookie-parser');

const { env } = require('./config/env');
const { connectDatabase, disconnectDatabase } = require('./config/db');
const { corsOptions } = require('./config/cors');
const { logger } = require('./utils/logger');
const { errorHandler } = require('./middleware/errorHandler');
const { requestId } = require('./middleware/requestId');
const { apiLimiter } = require('./middleware/rateLimiter');

// Import routes
const authRoutes = require('./routes/auth.routes');
const usersRoutes = require('./routes/users.routes');
const productsRoutes = require('./routes/products.routes');
const categoriesRoutes = require('./routes/categories.routes');
const craftsRoutes = require('./routes/crafts.routes');
const artisansRoutes = require('./routes/artisans.routes');
const cartRoutes = require('./routes/cart.routes');
const wishlistRoutes = require('./routes/wishlist.routes');
const ordersRoutes = require('./routes/orders.routes');
const reviewsRoutes = require('./routes/reviews.routes');
const storiesRoutes = require('./routes/stories.routes');
const notificationsRoutes = require('./routes/notifications.routes');
const adminRoutes = require('./routes/admin.routes');
const sellerRoutes = require('./routes/seller.routes');
const healthRoutes = require('./routes/health.routes');
const uploadRoutes = require('./routes/upload.routes');

const app = express();

app.use(helmet());
app.use(cors(corsOptions));
app.use(compression());
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(requestId);

if (env.NODE_ENV === 'development') {
  app.use((req, _res, next) => {
    logger.debug(`${req.method} ${req.url}`);
    next();
  });
}

// Global rate limiting — disabled in development to avoid hitting limits during active dev
if (env.NODE_ENV === 'production') {
  app.use('/api', apiLimiter);
}

// Register routes
app.use('/api/v1/health', healthRoutes);
app.use('/api/v1/upload', uploadRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', usersRoutes);
app.use('/api/v1/products', productsRoutes);
app.use('/api/v1/categories', categoriesRoutes);
app.use('/api/v1/crafts', craftsRoutes);
app.use('/api/v1/artisans', artisansRoutes);
app.use('/api/v1/cart', cartRoutes);
app.use('/api/v1/wishlist', wishlistRoutes);
app.use('/api/v1/orders', ordersRoutes);
app.use('/api/v1/reviews', reviewsRoutes);
app.use('/api/v1/stories', storiesRoutes);
app.use('/api/v1/notifications', notificationsRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/seller', sellerRoutes);

// Error handler
app.use(errorHandler);

let server;

async function startServer() {
  try {
    await connectDatabase();
    
    const PORT = env.PORT || 4000;
    server = app.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT} in ${env.NODE_ENV} mode`);
    });
  } catch (error) {
    logger.error({ error }, 'Failed to start server');
    process.exit(1);
  }
}

// Graceful shutdown
const gracefulShutdown = async (signal) => {
  logger.info(`\nReceived ${signal}. Shutting down gracefully...`);
  if (server) {
    server.close(async () => {
      logger.info('HTTP server closed.');
      await disconnectDatabase();
      process.exit(0);
    });
  } else {
    await disconnectDatabase();
    process.exit(0);
  }
  
  // Force exit after 10 seconds
  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('uncaughtException', (err) => {
  logger.error({ err }, 'Uncaught Exception');
  gracefulShutdown('uncaughtException');
});
process.on('unhandledRejection', (err) => {
  logger.error({ err }, 'Unhandled Rejection');
  gracefulShutdown('unhandledRejection');
});

startServer();
