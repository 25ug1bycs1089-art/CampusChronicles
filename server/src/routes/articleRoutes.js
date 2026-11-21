import express from 'express';
import {
  createArticle,
  getMyArticles,
  getPendingArticles,
  getArticleById,
  updateArticle,
  deleteArticle,
  getPublishedArticles,
  submitArticleForReview,
  approveArticle,
  rejectArticle,
  withdrawArticleSubmission,
} from '../controllers/articleController.js';
import {
  getArticleComments,
  addComment,
} from '../controllers/commentController.js';
import { protect, optionalProtect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public articles feed
router.get('/', getPublishedArticles);

// Authenticated user articles
router.get('/my', protect, getMyArticles);
router.post('/', protect, createArticle);

// Editorial review queue (MUST be before /:id)
router.get('/pending', protect, authorize('admin'), getPendingArticles);

// Workflow state transition actions
router.put('/:id/submit', protect, submitArticleForReview);
router.put('/:id/approve', protect, authorize('admin'), approveArticle);
router.put('/:id/reject', protect, authorize('admin'), rejectArticle);
router.put('/:id/withdraw', protect, withdrawArticleSubmission);

// Comments for an article
router.get('/:id/comments', optionalProtect, getArticleComments);
router.post('/:id/comments', protect, addComment);

// Single article operations
router.get('/:id', optionalProtect, getArticleById);
router.put('/:id', protect, updateArticle);
router.delete('/:id', protect, deleteArticle);

export default router;
