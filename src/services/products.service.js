const { Product, ProductStatus } = require('../models');
const { NotFoundError, ForbiddenError } = require('../utils/AppError');
const { slugify } = require('../utils/slugify');
const { randomBytes } = require('crypto');

function generateSku() {
  return `OC-${randomBytes(4).toString('hex').toUpperCase()}`;
}

async function list(filters = {}) {
  const {
    category, craft, district, featured, bestseller, newArrival,
    minPrice, maxPrice, q, sort = 'newest', page = 1, limit = 20,
  } = filters;

  const query = { status: ProductStatus.PUBLISHED, deletedAt: null };

  if (category) query.categoryId = category;
  if (craft) query.craftId = craft;
  if (district) query.district = { $regex: district, $options: 'i' };
  if (featured === 'true') query.isFeatured = true;
  if (bestseller === 'true') query.isBestseller = true;
  if (newArrival === 'true') query.isNewArrival = true;
  if (minPrice || maxPrice) {
    query.sellingPrice = {};
    if (minPrice) query.sellingPrice.$gte = Number(minPrice);
    if (maxPrice) query.sellingPrice.$lte = Number(maxPrice);
  }
  if (q) {
    query.$text = { $search: q };
  }

  const sortMap = {
    newest: { createdAt: -1 },
    price_asc: { sellingPrice: 1 },
    price_desc: { sellingPrice: -1 },
    rating: { rating: -1 },
    popular: { salesCount: -1 },
  };

  const skip = (page - 1) * limit;
  const [products, total] = await Promise.all([
    Product.find(query)
      .sort(sortMap[sort] || sortMap.newest)
      .skip(skip)
      .limit(Number(limit))
      .populate('categoryId', 'name slug')
      .populate('craftId', 'name slug')
      .populate({ path: 'sellerId', populate: { path: 'userId', select: 'name avatar' } })
      .lean(),
    Product.countDocuments(query),
  ]);

  return { products, pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) } };
}

async function getBySlug(slug) {
  const product = await Product.findOne({ slug, status: ProductStatus.PUBLISHED, deletedAt: null })
    .populate('categoryId', 'name slug')
    .populate('craftId', 'name slug')
    .populate({ path: 'sellerId', populate: { path: 'userId', select: 'name avatar' } })
    .lean();
  if (!product) throw new NotFoundError('Product not found');
  return product;
}

async function getById(id) {
  const product = await Product.findById(id)
    .populate('categoryId', 'name slug')
    .populate('craftId', 'name slug')
    .populate({ path: 'sellerId', populate: { path: 'userId', select: 'name avatar' } })
    .lean();
  if (!product) throw new NotFoundError('Product not found');
  return product;
}

async function create(sellerId, data) {
  const baseSlug = slugify(data.name || '');
  let slug = baseSlug;
  let counter = 1;
  while (await Product.exists({ slug })) {
    slug = `${baseSlug}-${counter++}`;
  }

  const sku = generateSku();

  return Product.create({
    ...data,
    slug,
    sku,
    sellerId,
    status: data.status || ProductStatus.SUBMITTED,
  });
}

async function update(id, sellerId, isAdmin, data) {
  const product = await Product.findById(id);
  if (!product) throw new NotFoundError('Product not found');

  const allowed = Array.isArray(sellerId) ? sellerId : [sellerId];
  if (!isAdmin && !allowed.includes(product.sellerId.toString())) {
    throw new ForbiddenError('You do not own this product');
  }

  if (!isAdmin && data.status === ProductStatus.PUBLISHED) {
    data.status = ProductStatus.SUBMITTED;
  }

  Object.assign(product, data);
  await product.save();
  return product;
}

async function softDelete(id, sellerId, isAdmin) {
  const product = await Product.findById(id);
  if (!product) throw new NotFoundError('Product not found');
  const allowed = Array.isArray(sellerId) ? sellerId : [sellerId];
  if (!isAdmin && !allowed.includes(product.sellerId.toString())) {
    throw new ForbiddenError('You do not own this product');
  }
  product.deletedAt = new Date();
  await product.save();
}

async function setStatus(id, status, adminNotes) {
  const update = { status };
  if (status === ProductStatus.PUBLISHED) update.publishedAt = new Date();
  if (adminNotes !== undefined) update.adminNotes = adminNotes;
  const product = await Product.findByIdAndUpdate(id, { $set: update }, { new: true });
  if (!product) throw new NotFoundError('Product not found');
  return product;
}

module.exports = { list, getBySlug, getById, create, update, softDelete, setStatus };
