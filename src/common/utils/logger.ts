import pino from 'pino';
import { env } from '../../config/env.js';

const pinoFn: any = (pino as any).default || pino;

export const logger = pinoFn({
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  transport:
    env.NODE_ENV === 'development'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
          },
        }
      : undefined,
});
