const { ForbiddenError } = require('../utils/AppError');
const { UserRole } = require('../models/User');

const requireRole = (...roles) => {
  return (req, _res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new ForbiddenError('You do not have permission to perform this action'));
    }
    next();
  };
};

const requireAdmin = requireRole(UserRole.ADMIN);
const requireSeller = requireRole(UserRole.SELLER, UserRole.ADMIN);
const requireCustomer = requireRole(UserRole.CUSTOMER, UserRole.ADMIN);

module.exports = { requireRole, requireAdmin, requireSeller, requireCustomer };
