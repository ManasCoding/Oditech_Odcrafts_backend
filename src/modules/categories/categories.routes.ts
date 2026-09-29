import { Router } from 'express';
import { CategoriesController } from './categories.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { requireAdmin } from '../../middleware/rbac.js';

const router = Router();

// Public
router.get('/', CategoriesController.getAll);
router.get('/:slug', CategoriesController.getBySlug);

// Admin only
router.post('/', authenticate, requireAdmin, CategoriesController.create);
router.patch('/:id', authenticate, requireAdmin, CategoriesController.update);
router.delete('/:id', authenticate, requireAdmin, CategoriesController.delete);

export default router;
