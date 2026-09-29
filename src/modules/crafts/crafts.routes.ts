import { Router } from 'express';
import { Craft } from '../../database/models/index.js';
import { authenticate } from '../../middleware/auth.js';
import { requireAdmin } from '../../middleware/rbac.js';

const router = Router();

router.get('/', async (_req, res, next) => {
  try {
    const crafts = await Craft.find({ isActive: true }).sort({ sortOrder: 1, name: 1 }).lean();
    res.json({ status: 'success', data: { crafts } });
  } catch (error) {
    next(error);
  }
});

router.get('/:slug', async (req, res, next) => {
  try {
    const craft = await Craft.findOne({ slug: req.params.slug, isActive: true }).lean();
    if (!craft) { res.status(404).json({ status: 'error', message: 'Craft not found' }); return; }
    res.json({ status: 'success', data: { craft } });
  } catch (error) {
    next(error);
  }
});

router.post('/', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const craft = await Craft.create(req.body);
    res.status(201).json({ status: 'success', data: { craft } });
  } catch (error) {
    next(error);
  }
});

router.patch('/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const craft = await Craft.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!craft) { res.status(404).json({ status: 'error', message: 'Craft not found' }); return; }
    res.json({ status: 'success', data: { craft } });
  } catch (error) {
    next(error);
  }
});

export default router;
