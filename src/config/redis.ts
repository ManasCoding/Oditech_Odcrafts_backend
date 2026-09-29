import IORedis from 'ioredis';
import { env } from './env.js';

const RedisClass: any = (IORedis as any).default || IORedis;

let redisInstance: any = null;

if (env.REDIS_URL) {
  let hasLoggedFailure = false;

  redisInstance = new RedisClass(env.REDIS_URL, {
    maxRetriesPerRequest: 1,
    retryStrategy: (times: number) => {
      if (times > 2) {
        if (!hasLoggedFailure) {
          console.warn('⚠️  Redis service is not running locally. Continuing without Redis cache/queues.');
          hasLoggedFailure = true;
        }
        return null; // Stop retrying
      }
      return 1000;
    },
  });

  redisInstance.on('error', (err: any) => {
    if (!hasLoggedFailure) {
      console.warn('⚠️  Redis connection notice:', err.message);
    }
  });

  redisInstance.on('connect', () => {
    console.log('✅ Redis Client Connected');
  });
}

export const redis = redisInstance;
