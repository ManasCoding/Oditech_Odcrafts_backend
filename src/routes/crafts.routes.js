const { Router } = require('express');
const { Craft } = require('../models');
const { authenticate } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/rbac');

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
    if (!craft) return res.status(404).json({ status: 'error', message: 'Craft not found' });
    res.json({ status: 'success', data: { craft } });
  } catch (error) {
    next(error);
  }
});

router.use(authenticate, requireAdmin);

router.post('/', async (req, res, next) => {
  try {
    const craft = await Craft.create(req.body);
    res.status(201).json({ status: 'success', data: { craft } });
  } catch (error) {
    next(error);
  }
});

router.patch('/:id', async (req, res, next) => {
  try {
    const craft = await Craft.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!craft) return res.status(404).json({ status: 'error', message: 'Craft not found' });
    res.json({ status: 'success', data: { craft } });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
