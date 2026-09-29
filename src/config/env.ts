import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load backend .env and root .env (so keys in either are always picked up)
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('4000'),
  MONGODB_URI: z.string().default('mongodb://localhost:27017/utkalnari'),
  REDIS_URL: z.string().optional(),

  // JWT
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 chars'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 chars'),
  JWT_ACCESS_EXPIRATION: z.string().default('15m'),
  JWT_REFRESH_EXPIRATION: z.string().default('7d'),

  // CORS
  CORS_ORIGINS: z.string().default('http://localhost:5173'),
  FRONTEND_URL: z.string().default('http://localhost:5173'),

  // Admin bootstrap
  ADMIN_EMAIL: z.string().email().optional(),
  ADMIN_PASSWORD: z.string().min(8).optional(),
  ADMIN_NAME: z.string().optional(),

  // Storage
  STORAGE_PROVIDER: z.enum(['local', 's3', 'r2', 'cloudinary']).default('cloudinary'),
  STORAGE_ACCESS_KEY: z.string().optional(),
  STORAGE_SECRET_KEY: z.string().optional(),
  STORAGE_BUCKET: z.string().optional(),
  STORAGE_REGION: z.string().optional(),
  STORAGE_ENDPOINT: z.string().optional(),

  // Cloudinary
  CLOUDINARY_CLOUD_NAME: z.string().transform((s) => s?.trim()).optional(),
  CLOUDINARY_API_KEY: z.string().transform((s) => s?.trim()).optional(),
  CLOUDINARY_API_SECRET: z.string().transform((s) => s?.trim()).optional(),
  CLOUDINARY_URL: z.string().transform((s) => s?.trim()).optional(),

  // Payment
  PAYMENT_PROVIDER: z.enum(['razorpay', 'stripe', 'manual']).default('manual'),
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional(),

  // Email
  EMAIL_PROVIDER: z.enum(['console', 'smtp', 'sendgrid']).default('console'),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  EMAIL_FROM: z.string().default('noreply@utkalnari.com'),

  // Logging
  LOG_LEVEL: z.string().default('debug'),

  // Rate limiting
  RATE_LIMIT_WINDOW_MS: z.string().default('900000'),
  RATE_LIMIT_MAX_REQUESTS: z.string().default('100'),

  // Bcrypt
  BCRYPT_ROUNDS: z.string().default('12'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', JSON.stringify(parsed.error.format(), null, 2));
  throw new Error('Invalid environment variables — check your .env file');
}

const rawData = parsed.data;

// If CLOUDINARY_URL is present, extract credentials if missing
if (rawData.CLOUDINARY_URL) {
  const match = rawData.CLOUDINARY_URL.match(/cloudinary:\/\/([^:]+):([^@]+)@(.+)/);
  if (match) {
    rawData.CLOUDINARY_API_KEY = rawData.CLOUDINARY_API_KEY || match[1]?.trim();
    rawData.CLOUDINARY_API_SECRET = rawData.CLOUDINARY_API_SECRET || match[2]?.trim();
    rawData.CLOUDINARY_CLOUD_NAME = rawData.CLOUDINARY_CLOUD_NAME || match[3]?.trim();
  }
}

export const env = rawData;
