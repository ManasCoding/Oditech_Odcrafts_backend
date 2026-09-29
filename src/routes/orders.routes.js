const { Router } = require('express');
const { authenticate } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/rbac');
const OrdersService = require('../services/orders.service');

const router = Router();

router.post('/', authenticate, async (req, res, next) => {
  try {
    const { addressId } = req.body;
    const order = await OrdersService.createFromCart(req.user.id, addressId);
    res.status(201).json({ status: 'success', data: { order } });
  } catch (error) {
    next(error);
  }
});

router.get('/', authenticate, async (req, res, next) => {
  try {
    const result = await OrdersService.getMyOrders(req.user.id, Number(req.query.page) || 1, Number(req.query.limit) || 10);
    res.json({ status: 'success', data: result });
  } catch (error) {
    next(error);
  }
});

router.get('/:orderId', authenticate, async (req, res, next) => {
  try {
    const order = await OrdersService.getById(req.params.orderId, req.user.id);
    res.json({ status: 'success', data: { order } });
  } catch (error) {
    next(error);
  }
});

router.post('/:orderId/cancel', authenticate, async (req, res, next) => {
  try {
    const order = await OrdersService.cancelOrder(req.params.orderId, req.user.id);
    res.json({ status: 'success', data: { order } });
  } catch (error) {
    next(error);
  }
});

// Admin routes
router.get('/admin/all', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const result = await OrdersService.adminList({
      status: req.query.status,
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 20,
      search: req.query.search,
    });
    res.json({ status: 'success', data: result });
  } catch (error) {
    next(error);
  }
});

router.patch('/admin/:orderId/status', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { status, notes } = req.body;
    const order = await OrdersService.adminUpdateStatus(req.params.orderId, status, req.user.id, notes);
    res.json({ status: 'success', data: { order } });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
