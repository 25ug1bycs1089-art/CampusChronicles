import express from 'express';
import { uploadImage } from '../controllers/uploadController.js';
import { protect } from '../middleware/authMiddleware.js';
import { uploadMiddleware } from '../middleware/uploadMiddleware.js';

const router = express.Router();

/**
 * POST /api/upload/image
 * Authenticated image upload to Cloudinary.
 * Field name: "image"
 * Max size:   8 MB
 * Types:      JPEG, PNG, WebP, GIF
 */
router.post(
  '/image',
  protect,
  uploadMiddleware.single('image'),
  uploadImage
);

export default router;
