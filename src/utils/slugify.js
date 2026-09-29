const slugifyModule = require('slugify');

function slugify(text) {
  return slugifyModule(text, { lower: true, strict: true, trim: true });
}

module.exports = { slugify };
