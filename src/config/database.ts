import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from '../common/utils/logger.js';

let isConnected = false;

export async function connectDatabase(): Promise<void> {
  if (isConnected) return;

  try {
    await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    isConnected = true;
    logger.info({ uri: env.MONGODB_URI.replace(/\/\/.*@/, '//***@') }, '✅ MongoDB connected');

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

export async function disconnectDatabase(): Promise<void> {
  if (!isConnected) return;
  await mongoose.disconnect();
  isConnected = false;
  logger.info('MongoDB disconnected gracefully');
}

export { mongoose };
