import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { Notification } from '../../database/models/index.js';

const router = Router();
router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    const notifications = await Notification.find({ userId: req.user!.id })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    const unreadCount = await Notification.countDocuments({ userId: req.user!.id, isRead: false });
    res.json({ status: 'success', data: { notifications, unreadCount } });
  } catch (error) {
    next(error);
  }
});

router.patch('/:id/read', async (req, res, next) => {
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user!.id },
      { isRead: true, readAt: new Date() }
    );
    res.json({ status: 'success' });
  } catch (error) {
    next(error);
  }
});

router.patch('/read-all', async (req, res, next) => {
  try {
    await Notification.updateMany(
      { userId: req.user!.id, isRead: false },
      { isRead: true, readAt: new Date() }
    );
    res.json({ status: 'success' });
  } catch (error) {
    next(error);
  }
});

export default router;
