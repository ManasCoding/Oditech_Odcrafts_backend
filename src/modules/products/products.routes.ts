import { Router } from 'express';
import { ProductsController } from './products.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { requireSeller, requireAdmin } from '../../middleware/rbac.js';

const router = Router();

// Public
router.get('/', ProductsController.list);
router.get('/related', ProductsController.getRelated);
router.get('/:slug', ProductsController.getBySlug);

// Seller/Admin protected
router.post('/', authenticate, requireSeller, ProductsController.create);
router.patch('/:id', authenticate, requireSeller, ProductsController.update);
router.delete('/:id', authenticate, requireSeller, ProductsController.delete);

// Admin only
router.patch('/:id/status', authenticate, requireAdmin, ProductsController.setStatus);

export default router;
