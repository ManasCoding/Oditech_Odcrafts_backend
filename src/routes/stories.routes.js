const { Router } = require('express');
const { CulturalStory } = require('../models');
const { authenticate } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/rbac');
const { slugify } = require('../utils/slugify');

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const { category, page = 1, limit = 10 } = req.query;
    const query = { isPublished: true };
    if (category) query.category = category;
    
    const skip = (Number(page) - 1) * Number(limit);
    const [stories, total] = await Promise.all([
      CulturalStory.find(query).sort({ publishedAt: -1 }).skip(skip).limit(Number(limit)).lean(),
      CulturalStory.countDocuments(query),
    ]);
    
    res.json({
      status: 'success',
      data: { stories, pagination: { total, page: Number(page), limit: Number(limit) } },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:slug', async (req, res, next) => {
  try {
    const story = await CulturalStory.findOneAndUpdate(
      { slug: req.params.slug, isPublished: true },
      { $inc: { viewCount: 1 } },
      { new: true }
    ).populate('relatedArtisanId', 'userId craftType photo').populate('relatedProductIds', 'name images sellingPrice slug').lean();
    
    if (!story) return res.status(404).json({ status: 'error', message: 'Story not found' });
    res.json({ status: 'success', data: { story } });
  } catch (error) {
    next(error);
  }
});

router.use(authenticate, requireAdmin);

router.post('/', async (req, res, next) => {
  try {
    let slug = slugify(req.body.title);
    let counter = 1;
    while (await CulturalStory.exists({ slug })) {
      slug = `${slugify(req.body.title)}-${counter++}`;
    }
    const story = await CulturalStory.create({ ...req.body, slug });
    res.status(201).json({ status: 'success', data: { story } });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
