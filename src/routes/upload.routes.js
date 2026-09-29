const { Router } = require('express');
const { authenticate } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const { env } = require('../config/env');
const cloudinary = require('cloudinary').v2;

// Configure cloudinary
cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
});

const router = Router();

/**
 * POST /api/v1/upload/image
 * Uploads a single image to Cloudinary and returns the secure URL.
 * Requires authentication.
 */
router.post('/image', authenticate, upload.single('image'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ status: 'error', message: 'No image file provided' });
    }

    // Convert buffer to base64 data URI for Cloudinary upload
    const b64 = req.file.buffer.toString('base64');
    const dataURI = `data:${req.file.mimetype};base64,${b64}`;

    const result = await cloudinary.uploader.upload(dataURI, {
      folder: 'ODCRAFTS',
      resource_type: 'image',
      transformation: [{ width: 800, crop: 'limit', quality: 'auto', fetch_format: 'auto' }],
    });

    res.json({
      status: 'success',
      data: {
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
