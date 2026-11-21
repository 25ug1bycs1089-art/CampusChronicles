import mongoose from 'mongoose';
import Comment from '../models/Comment.js';
import Article from '../models/Article.js';

/**
 * @desc    Get comments for a published article
 * @route   GET /api/articles/:id/comments
 * @access  Public (for published articles; private for author/staff)
 */
export const getArticleComments = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid article ID format' });
    }

    const article = await Article.findById(id);
    if (!article) {
      return res.status(404).json({ success: false, message: 'Article not found' });
    }

    // Only comments on published articles are accessible publicly
    if (article.status !== 'published') {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required to access comments on unpublished articles',
        });
      }

      const isAuthor = article.author.toString() === req.user._id.toString();
      const isStaff = ['admin'].includes(req.user.role);

      if (!isAuthor && !isStaff) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: Cannot view comments on this unpublished article',
        });
      }
    }

    const comments = await Comment.find({ article: id })
      .populate('author', 'name email role department profilePicture')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: comments.length,
      comments,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Post a comment on a published article
 * @route   POST /api/articles/:id/comments
 * @access  Private (Authenticated users only)
 */
export const addComment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid article ID format' });
    }

    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Comment content cannot be empty' });
    }

    if (content.trim().length > 1000) {
      return res.status(400).json({
        success: false,
        message: 'Comment cannot exceed 1000 characters',
      });
    }

    const article = await Article.findById(id);
    if (!article) {
      return res.status(404).json({ success: false, message: 'Article not found' });
    }

    if (article.status !== 'published') {
      return res.status(400).json({
        success: false,
        message: 'Comments can only be posted on published articles',
      });
    }

    const comment = await Comment.create({
      article: id,
      author: req.user._id,
      content: content.trim(),
    });

    await comment.populate('author', 'name email role department profilePicture');

    res.status(201).json({
      success: true,
      message: 'Comment posted successfully',
      comment,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a comment
 * @route   DELETE /api/comments/:id
 * @access  Private (Comment author or Admin only)
 */
export const deleteComment = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid comment ID format' });
    }

    const comment = await Comment.findById(id);
    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }

    const isAuthor = comment.author.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isAuthor && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You can only delete your own comments, or you must be an administrator.',
      });
    }

    await Comment.deleteOne({ _id: id });

    res.status(200).json({
      success: true,
      message: 'Comment deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
