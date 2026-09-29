const { Router } = require('express');
const { ProductsController } = require('../controllers/products.controller');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { requireSeller } = require('../middleware/rbac');

const router = Router();

router.get('/', optionalAuth, ProductsController.list);
router.get('/:slug', optionalAuth, ProductsController.getBySlug);

router.use(authenticate, requireSeller);
router.post('/', ProductsController.create);
router.patch('/:id', ProductsController.update);
router.delete('/:id', ProductsController.delete);

module.exports = router;
