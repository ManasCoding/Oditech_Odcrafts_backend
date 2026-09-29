const jwt = require('jsonwebtoken');
const { env } = require('../config/env');
const { UnauthorizedError } = require('../utils/AppError');

const authenticate = (req, _res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new UnauthorizedError('Authentication required'));
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);
    req.user = { id: decoded.userId, role: decoded.role };
    next();
  } catch {
    next(new UnauthorizedError('Invalid or expired token'));
  }
};

const optionalAuth = (req, _res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return next();

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);
    req.user = { id: decoded.userId, role: decoded.role };
  } catch {
    // silently ignore
  }
  next();
};

module.exports = { authenticate, optionalAuth };
