const { Router } = require('express');
const { authenticate } = require('../middleware/auth');
const CartService = require('../services/cart.service');

const router = Router();
router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    const cart = await CartService.getCart(req.user.id);
    res.json({ status: 'success', data: { cart } });
  } catch (error) {
    next(error);
  }
});

router.post('/items', async (req, res, next) => {
  try {
    const { productId, quantity = 1 } = req.body;
    const cart = await CartService.addItem(req.user.id, productId, Number(quantity));
    res.status(201).json({ status: 'success', data: { cart } });
  } catch (error) {
    next(error);
  }
});

router.patch('/items/:itemId', async (req, res, next) => {
  try {
    const { quantity } = req.body;
    const cart = await CartService.updateQuantity(req.user.id, req.params.itemId, Number(quantity));
    res.json({ status: 'success', data: { cart } });
  } catch (error) {
    next(error);
  }
});

router.delete('/items/:itemId', async (req, res, next) => {
  try {
    const cart = await CartService.removeItem(req.user.id, req.params.itemId);
    res.json({ status: 'success', data: { cart } });
  } catch (error) {
    next(error);
  }
});

router.delete('/', async (req, res, next) => {
  try {
    await CartService.clearCart(req.user.id);
    res.json({ status: 'success', message: 'Cart cleared' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
