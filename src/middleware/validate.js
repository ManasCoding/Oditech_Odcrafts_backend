const { ValidationError } = require('../utils/AppError');

/**
 * Simple validation middleware.
 * Pass a schema object with optional keys: body, query, params.
 * Each key is a function(value) => { error } or truthy for pass.
 * For simple use, pass a validator function that throws ValidationError directly.
 */
const validate = (validatorFn) => {
  return async (req, _res, next) => {
    try {
      await validatorFn({ body: req.body, query: req.query, params: req.params });
      next();
    } catch (error) {
      if (error instanceof ValidationError) {
        next(error);
      } else if (error && error.message) {
        next(new ValidationError(error.message));
      } else {
        next(new ValidationError('Validation failed'));
      }
    }
  };
};

module.exports = { validate };
