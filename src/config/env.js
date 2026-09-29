require('dotenv').config({ path: require('path').resolve(process.cwd(), '.env') });
require('dotenv').config();

function required(name) {
  const val = process.env[name];
  if (!val) throw new Error(`Missing required env variable: ${name}`);
  return val;
}

function optional(name, defaultValue = undefined) {
  return process.env[name] || defaultValue;
}

const env = {
  NODE_ENV: optional('NODE_ENV', 'development'),
  PORT: optional('PORT', '4000'),

  MONGODB_URI: optional('MONGODB_URI', 'mongodb://localhost:27017/ODCRAFTS'),
  REDIS_URL: optional('REDIS_URL'),

  // JWT
  JWT_ACCESS_SECRET: required('JWT_ACCESS_SECRET'),
  JWT_REFRESH_SECRET: required('JWT_REFRESH_SECRET'),
  JWT_ACCESS_EXPIRATION: optional('JWT_ACCESS_EXPIRATION', '15m'),
  JWT_REFRESH_EXPIRATION: optional('JWT_REFRESH_EXPIRATION', '7d'),

  // CORS
  CORS_ORIGINS: optional('CORS_ORIGINS', 'http://localhost:5173'),
  FRONTEND_URL: optional('FRONTEND_URL', 'http://localhost:5173'),

  // Admin bootstrap
  ADMIN_EMAIL: optional('ADMIN_EMAIL'),
  ADMIN_PASSWORD: optional('ADMIN_PASSWORD'),
  ADMIN_NAME: optional('ADMIN_NAME'),

  // Storage
  STORAGE_PROVIDER: optional('STORAGE_PROVIDER', 'cloudinary'),
  STORAGE_ACCESS_KEY: optional('STORAGE_ACCESS_KEY'),
  STORAGE_SECRET_KEY: optional('STORAGE_SECRET_KEY'),
  STORAGE_BUCKET: optional('STORAGE_BUCKET'),
  STORAGE_REGION: optional('STORAGE_REGION'),
  STORAGE_ENDPOINT: optional('STORAGE_ENDPOINT'),

  // Cloudinary
  CLOUDINARY_CLOUD_NAME: optional('CLOUDINARY_CLOUD_NAME'),
  CLOUDINARY_API_KEY: optional('CLOUDINARY_API_KEY'),
  CLOUDINARY_API_SECRET: optional('CLOUDINARY_API_SECRET'),
  CLOUDINARY_URL: optional('CLOUDINARY_URL'),

  // Payment
  PAYMENT_PROVIDER: optional('PAYMENT_PROVIDER', 'manual'),
  RAZORPAY_KEY_ID: optional('RAZORPAY_KEY_ID'),
  RAZORPAY_KEY_SECRET: optional('RAZORPAY_KEY_SECRET'),
  RAZORPAY_WEBHOOK_SECRET: optional('RAZORPAY_WEBHOOK_SECRET'),

  // Email
  EMAIL_PROVIDER: optional('EMAIL_PROVIDER', 'console'),
  SMTP_HOST: optional('SMTP_HOST'),
  SMTP_PORT: optional('SMTP_PORT'),
  SMTP_USER: optional('SMTP_USER'),
  SMTP_PASS: optional('SMTP_PASS'),
  EMAIL_FROM: optional('EMAIL_FROM', 'noreply@ODCRAFTS.com'),

  // Logging
  LOG_LEVEL: optional('LOG_LEVEL', 'debug'),

  // Rate limiting
  RATE_LIMIT_WINDOW_MS: optional('RATE_LIMIT_WINDOW_MS', '900000'),
  RATE_LIMIT_MAX_REQUESTS: optional('RATE_LIMIT_MAX_REQUESTS', '100'),

  // Bcrypt
  BCRYPT_ROUNDS: optional('BCRYPT_ROUNDS', '12'),
};

// Extract Cloudinary credentials from CLOUDINARY_URL if provided
if (env.CLOUDINARY_URL) {
  const match = env.CLOUDINARY_URL.match(/cloudinary:\/\/([^:]+):([^@]+)@(.+)/);
  if (match) {
    env.CLOUDINARY_API_KEY = env.CLOUDINARY_API_KEY || match[1].trim();
    env.CLOUDINARY_API_SECRET = env.CLOUDINARY_API_SECRET || match[2].trim();
    env.CLOUDINARY_CLOUD_NAME = env.CLOUDINARY_CLOUD_NAME || match[3].trim();
  }
}

module.exports = { env };
