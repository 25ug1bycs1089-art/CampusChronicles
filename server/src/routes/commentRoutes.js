import express from 'express';
import { deleteComment } from '../controllers/commentController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Delete a comment (Author or Admin only)
router.delete('/:id', protect, deleteComment);

export default router;
