const mongoose = require('mongoose');
const { env } = require('./env');
const { logger } = require('../utils/logger');

let isConnected = false;

async function connectDatabase() {
  if (isConnected) return;

  try {
    await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    isConnected = true;
    logger.info('✅ MongoDB connected to ' + env.MONGODB_URI.replace(/\/\/.*@/, '//***@'));

    mongoose.connection.on('error', (err) => {
      logger.error({ err }, 'MongoDB connection error');
      isConnected = false;
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected — attempting reconnect...');
      isConnected = false;
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
      isConnected = true;
    });
  } catch (error) {
    logger.error({ error }, '❌ MongoDB connection failed');
    throw error;
  }
}

async function disconnectDatabase() {
  if (!isConnected) return;
  await mongoose.disconnect();
  isConnected = false;
  logger.info('MongoDB disconnected gracefully');
}

module.exports = { connectDatabase, disconnectDatabase, mongoose };
