import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { redis } from '../../config/redis.js';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date(), uptime: process.uptime() });
});

router.get('/db', (_req: Request, res: Response) => {
  const state = mongoose.connection.readyState;
  if (state === 1) {
    res.json({ status: 'ok', message: 'MongoDB connected' });
  } else {
    res.status(500).json({ status: 'error', message: 'MongoDB disconnected', state });
  }
});

router.get('/redis', async (_req: Request, res: Response) => {
  if (!redis) return res.json({ status: 'skipped', message: 'Redis not configured' });
  try {
    await redis.ping();
    res.json({ status: 'ok', message: 'Redis connected' });
  } catch {
    res.status(500).json({ status: 'error', message: 'Redis connection failed' });
  }
});

export default router;
