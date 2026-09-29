import { Router } from 'express';
import { CulturalStory } from '../../database/models/index.js';
import { authenticate } from '../../middleware/auth.js';
import { requireAdmin } from '../../middleware/rbac.js';
import { NotFoundError } from '../../common/errors/AppError.js';

const router = Router();

// Public: List stories
router.get('/', async (req, res, next) => {
  try {
    const { category, featured, page = '1', limit = '12' } = req.query;
    const query: Record<string, unknown> = { isPublished: true };

    if (category) query.category = category;
    if (featured === 'true') query.isFeatured = true;

    const skip = (Number(page) - 1) * Number(limit);

    const [stories, total] = await Promise.all([
      CulturalStory.find(query)
        .sort({ isFeatured: -1, publishedAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .select('title slug category excerpt heroImage readTimeMinutes isFeatured publishedAt tags')
        .populate('relatedArtisanId', 'slug')
        .populate({ path: 'relatedArtisanId', populate: { path: 'userId', select: 'name' } })
        .lean(),
      CulturalStory.countDocuments(query),
    ]);

    res.json({
      status: 'success',
      data: {
        stories,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

// Public: Get story by slug
router.get('/:slug', async (req, res, next) => {
  try {
    const story = await CulturalStory.findOneAndUpdate(
      { slug: req.params.slug, isPublished: true },
      { $inc: { viewCount: 1 } },
      { new: true }
    )
      .populate('relatedArtisanId', 'slug district craftType artisanStory photo')
      .populate({ path: 'relatedArtisanId', populate: { path: 'userId', select: 'name avatar' } })
      .populate('relatedProductIds', 'name slug images sellingPrice rating')
      .populate('relatedCraftId', 'name slug description')
      .lean();

    if (!story) throw new NotFoundError('Story not found');

    // Fetch related stories in same category
    const related = await CulturalStory.find({
      _id: { $ne: story._id },
      category: story.category,
      isPublished: true,
    })
      .limit(3)
      .select('title slug category excerpt heroImage readTimeMinutes publishedAt')
      .lean();

    res.json({ status: 'success', data: { story, related } });
  } catch (error) {
    next(error);
  }
});

// Admin: Create story
router.post('/', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const story = await CulturalStory.create({
      ...req.body,
      publishedAt: req.body.isPublished ? new Date() : undefined,
    });
    res.status(201).json({ status: 'success', data: { story } });
  } catch (error) {
    next(error);
  }
});

// Admin: Update story
router.patch('/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    if (req.body.isPublished) req.body.publishedAt = new Date();
    const story = await CulturalStory.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!story) throw new NotFoundError('Story not found');
    res.json({ status: 'success', data: { story } });
  } catch (error) {
    next(error);
  }
});

// Admin: Delete story
router.delete('/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    await CulturalStory.findByIdAndDelete(req.params.id);
    res.json({ status: 'success', message: 'Story deleted' });
  } catch (error) {
    next(error);
  }
});

export default router;
