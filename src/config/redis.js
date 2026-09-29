const { env } = require('./env');

let redisInstance = null;

if (env.REDIS_URL) {
  const IORedis = require('ioredis');
  let hasLoggedFailure = false;

  redisInstance = new IORedis(env.REDIS_URL, {
    maxRetriesPerRequest: 1,
    retryStrategy(times) {
      if (times > 2) {
        if (!hasLoggedFailure) {
          console.warn('⚠️  Redis service is not running. Continuing without Redis.');
          hasLoggedFailure = true;
        }
        return null;
      }
      return 1000;
    },
  });

  redisInstance.on('error', (err) => {
    if (!hasLoggedFailure) {
      console.warn('⚠️  Redis connection notice:', err.message);
    }
  });

  redisInstance.on('connect', () => {
    console.log('✅ Redis connected');
  });
}

module.exports = { redis: redisInstance };
