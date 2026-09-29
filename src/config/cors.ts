import { env } from './env.js';

const origins = env.CORS_ORIGINS === '*' 
  ? '*' 
  : env.CORS_ORIGINS.split(',').map((o) => o.trim());

export const corsOptions = {
  origin: origins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-request-id'],
};
