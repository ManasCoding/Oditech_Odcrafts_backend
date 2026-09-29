const { Router } = require('express');
const { UsersController } = require('../controllers/users.controller');
const { authenticate } = require('../middleware/auth');
const { Address } = require('../models');

const router = Router();

router.use(authenticate);
router.get('/me', UsersController.getMe);
router.patch('/me', UsersController.updateMe);

// Address endpoints
router.get('/addresses', async (req, res, next) => {
  try {
    const addresses = await Address.find({ userId: req.user.id }).sort({ isDefault: -1, createdAt: -1 });
    res.json({ status: 'success', data: { addresses } });
  } catch (error) {
    next(error);
  }
});

router.post('/addresses', async (req, res, next) => {
  try {
    const address = await Address.create({ ...req.body, userId: req.user.id });
    res.status(201).json({ status: 'success', data: { address } });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
