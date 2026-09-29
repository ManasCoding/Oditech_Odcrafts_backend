const { Router } = require('express');
const { CategoriesController } = require('../controllers/categories.controller');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/rbac');

const router = Router();

router.get('/', optionalAuth, CategoriesController.getAll);
router.get('/:slug', optionalAuth, CategoriesController.getBySlug);

router.use(authenticate, requireAdmin);
router.post('/', CategoriesController.create);
router.patch('/:id', CategoriesController.update);
router.delete('/:id', CategoriesController.delete);

module.exports = router;
