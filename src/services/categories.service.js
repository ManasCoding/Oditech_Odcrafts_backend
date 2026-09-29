const { Category } = require('../models');
const { NotFoundError } = require('../utils/AppError');

async function getAll(includeInactive = false) {
  const filter = includeInactive ? {} : { isActive: true };
  return Category.find(filter).sort({ sortOrder: 1, name: 1 }).lean();
}

async function getBySlug(slug) {
  const category = await Category.findOne({ slug, isActive: true }).lean();
  if (!category) throw new NotFoundError('Category not found');
  return category;
}

async function create(data) {
  return Category.create(data);
}

async function update(id, data) {
  const category = await Category.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!category) throw new NotFoundError('Category not found');
  return category;
}

async function remove(id) {
  const category = await Category.findByIdAndUpdate(id, { isActive: false }, { new: true });
  if (!category) throw new NotFoundError('Category not found');
  return category;
}

module.exports = { getAll, getBySlug, create, update, remove };
