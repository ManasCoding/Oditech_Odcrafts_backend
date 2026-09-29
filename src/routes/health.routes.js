const { Router } = require('express');
const mongoose = require('mongoose');
const { redis } = require('../config/redis');

const router = Router();

router.get('/', (_req, res) => {
  res.json({ status: 'success', message: 'API is running' });
});

router.get('/db', async (_req, res) => {
  try {
    const dbState = mongoose.connection.readyState;
    const states = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
    let redisStatus = 'not configured';
    if (redis) {
      redisStatus = redis.status === 'ready' ? 'connected' : redis.status;
    }
    
    res.json({
      status: dbState === 1 ? 'success' : 'error',
      data: {
        mongodb: states[dbState] || 'unknown',
        redis: redisStatus,
        uptime: process.uptime()
      }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

module.exports = router;
