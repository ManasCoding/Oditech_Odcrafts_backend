import { Router } from 'express';
import { UsersController } from './users.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { updateProfileSchema } from './users.dto.js';
import { Address } from '../../database/models/index.js';

const router = Router();

router.use(authenticate);
router.get('/me', UsersController.getMe);
router.patch('/me', validate(updateProfileSchema), UsersController.updateMe);

// Address endpoints
router.get('/addresses', async (req, res, next) => {
  try {
    const addresses = await Address.find({ userId: req.user!.id }).sort({ isDefault: -1, createdAt: -1 });
    res.json({ status: 'success', data: { addresses } });
  } catch (error) {
    next(error);
  }
});

router.post('/addresses', async (req, res, next) => {
  try {
    const address = await Address.create({
      ...req.body,
      userId: req.user!.id,
    });
    res.status(201).json({ status: 'success', data: { address } });
  } catch (error) {
    next(error);
  }
});

export default router;
