const { randomBytes } = require('crypto');

function generateId(prefix = '') {
  return `${prefix}${randomBytes(5).toString('hex')}`;
}

module.exports = { generateId };
