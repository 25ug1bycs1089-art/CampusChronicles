import mongoose from 'mongoose';
import Article from '../models/Article.js';

/**
 * @desc    Create a new article draft
 * @route   POST /api/articles
 * @access  Private (Authenticated users)
 */
export const createArticle = async (req, res, next) => {
  try {
    const { title, excerpt, content, category, coverImage } = req.body;

    // Validation
    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Article title is required' });
    }
    if (!excerpt || !excerpt.trim()) {
      return res.status(400).json({ success: false, message: 'Short excerpt is required' });
    }
    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Article content cannot be empty' });
    }
    if (!category || !category.trim()) {
      return res.status(400).json({ success: false, message: 'Please select a category' });
    }

    // Force protected fields: author is ALWAYS req.user, status is ALWAYS 'draft'
    const article = await Article.create({
      title: title.trim(),
      excerpt: excerpt.trim(),
      content,
      category: category.trim(),
      coverImage: coverImage ? coverImage.trim() : '',
      author: req.user._id,
      status: 'draft',
    });

    res.status(201).json({
      success: true,
      message: 'Draft saved successfully',
      article,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get articles created by the authenticated user
 * @route   GET /api/articles/my
 * @access  Private (Authenticated users)
 */
export const getMyArticles = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const filter = { author: req.user._id };
    if (status && status !== 'all') {
      filter.status = status;
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const [articles, totalFiltered, counts] = await Promise.all([
      Article.find(filter)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate('author', 'name email role profilePicture')
        .populate('reviewedBy', 'name email role'),
      Article.countDocuments(filter),
      Promise.all([
        Article.countDocuments({ author: req.user._id }),
        Article.countDocuments({ author: req.user._id, status: 'draft' }),
        Article.countDocuments({ author: req.user._id, status: 'pending' }),
        Article.countDocuments({ author: req.user._id, status: 'published' }),
        Article.countDocuments({ author: req.user._id, status: 'rejected' }),
      ]),
    ]);

    const [totalAll, draftCount, pendingCount, publishedCount, rejectedCount] = counts;

    res.status(200).json({
      success: true,
      articles,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalFiltered,
        totalPages: Math.ceil(totalFiltered / limitNum),
      },
      counts: {
        all: totalAll,
        draft: draftCount,
        pending: pendingCount,
        published: publishedCount,
        rejected: rejectedCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get articles awaiting editorial review
 * @route   GET /api/articles/pending
 * @access  Private (Editor, Admin)
 */
export const getPendingArticles = async (req, res, next) => {
  try {
    const pendingFilter = {
      status: { $in: ['pending', 'pending_review', 'pending review'] },
    };

    const [articles, stats] = await Promise.all([
      Article.find(pendingFilter)
        .sort({ updatedAt: -1, createdAt: -1 })
        .populate('author', 'name email role profilePicture department bio'),
      Promise.all([
        Article.countDocuments(pendingFilter),
        Article.countDocuments({ status: 'published' }),
        Article.countDocuments({ status: 'rejected' }),
        Article.countDocuments({}),
      ]),
    ]);

    const [pendingCount, publishedCount, rejectedCount, totalCount] = stats;

    res.status(200).json({
      success: true,
      count: articles.length,
      articles,
      stats: {
        pending: pendingCount,
        published: publishedCount,
        rejected: rejectedCount,
        total: totalCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single article by ID
 * @route   GET /api/articles/:id
 * @access  Public for published; Private (author/editor/admin) for drafts/pending/rejected
 */
export const getArticleById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid article ID format' });
    }

    const article = await Article.findById(id)
      .populate('author', 'name email role profilePicture bio department')
      .populate('reviewedBy', 'name email role');

    if (!article) {
      return res.status(404).json({ success: false, message: 'Article not found' });
    }

    // Access control for non-published articles: return 404 to prevent enumerating unpublished drafts
    if (article.status !== 'published') {
      if (!req.user) {
        return res.status(404).json({
          success: false,
          message: 'Article not found',
        });
      }

      const isAuthor = article.author._id.toString() === req.user._id.toString();
      const isStaff = ['admin'].includes(req.user.role);

      if (!isAuthor && !isStaff) {
        return res.status(404).json({
          success: false,
          message: 'Article not found',
        });
      }
    }

    // Increment views for published articles
    if (article.status === 'published') {
      await Article.findByIdAndUpdate(id, { $inc: { views: 1 } });
      article.views = (article.views || 0) + 1;
    }

    // Retrieve related published articles in the same category
    let relatedArticles = [];
    if (article.status === 'published') {
      relatedArticles = await Article.find({
        _id: { $ne: article._id },
        status: 'published',
        category: article.category,
      })
        .select('title excerpt coverImage category publishedAt createdAt author views')
        .populate('author', 'name email role department profilePicture')
        .limit(3)
        .sort({ publishedAt: -1 });
    }

    res.status(200).json({
      success: true,
      article,
      relatedArticles,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update an existing article draft or rejected article
 * @route   PUT /api/articles/:id
 * @access  Private (Author only, and only if status is 'draft' or 'rejected')
 */
export const updateArticle = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid article ID format' });
    }

    const article = await Article.findById(id);

    if (!article) {
      return res.status(404).json({ success: false, message: 'Article not found' });
    }

    // Ownership check
    if (article.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You cannot edit articles belonging to other authors',
      });
    }

    // Status constraint: only drafts and rejected articles can be edited
    if (article.status !== 'draft' && article.status !== 'rejected') {
      return res.status(400).json({
        success: false,
        message: `Articles with status '${article.status}' cannot be edited directly. Withdraw pending submissions first if you need to modify them.`,
      });
    }

    const { title, excerpt, content, category, coverImage } = req.body;

    if (title !== undefined) {
      if (!title.trim()) return res.status(400).json({ success: false, message: 'Title cannot be empty' });
      article.title = title.trim();
    }

    if (excerpt !== undefined) {
      if (!excerpt.trim()) return res.status(400).json({ success: false, message: 'Excerpt cannot be empty' });
      article.excerpt = excerpt.trim();
    }

    if (content !== undefined) {
      if (!content.trim() || content === '<p></p>') {
        return res.status(400).json({ success: false, message: 'Content cannot be empty' });
      }
      article.content = content;
    }

    if (category !== undefined) {
      if (!category.trim()) return res.status(400).json({ success: false, message: 'Category cannot be empty' });
      article.category = category.trim();
    }

    if (coverImage !== undefined) {
      article.coverImage = coverImage ? coverImage.trim() : '';
    }

    // Note: status, author, reviewedBy, publishedAt are protected and intentionally not updated here

    await article.save();

    res.status(200).json({
      success: true,
      message: 'Article updated successfully',
      article,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete an article
 * @route   DELETE /api/articles/:id
 * @access  Private (Author only, and only if status is 'draft' or 'rejected')
 */
export const deleteArticle = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid article ID format' });
    }

    const article = await Article.findById(id);

    if (!article) {
      return res.status(404).json({ success: false, message: 'Article not found' });
    }

    // Ownership check
    if (article.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You cannot delete articles belonging to other authors',
      });
    }

    // Status constraint: only drafts and rejected articles can be deleted
    if (article.status !== 'draft' && article.status !== 'rejected') {
      return res.status(400).json({
        success: false,
        message: `Articles with status '${article.status}' cannot be deleted. Pending and published articles cannot be deleted.`,
      });
    }

    await Article.deleteOne({ _id: article._id });

    res.status(200).json({
      success: true,
      message: 'Article deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Submit an article draft or rejected article for editorial review
 * @route   PUT /api/articles/:id/submit
 * @access  Private (Author only)
 */
export const submitArticleForReview = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid article ID format' });
    }

    const article = await Article.findById(id);

    if (!article) {
      return res.status(404).json({ success: false, message: 'Article not found' });
    }

    // Enforce article ownership
    if (article.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You can only submit your own articles for editorial review',
      });
    }

    // Only draft or rejected articles can be submitted
    if (article.status === 'pending') {
      return res.status(400).json({
        success: false,
        message: 'This article is already submitted and currently awaiting editorial review',
      });
    }

    if (article.status === 'published') {
      return res.status(400).json({
        success: false,
        message: 'Published articles cannot be resubmitted',
      });
    }

    // Validate article fields before submission
    if (!article.title || !article.title.trim()) {
      return res.status(400).json({ success: false, message: 'Article must have a title before submission' });
    }
    if (!article.excerpt || !article.excerpt.trim()) {
      return res.status(400).json({ success: false, message: 'Article must have an excerpt before submission' });
    }
    if (!article.content || !article.content.trim() || article.content === '<p></p>') {
      return res.status(400).json({ success: false, message: 'Article content cannot be empty' });
    }
    if (!article.category || !article.category.trim()) {
      return res.status(400).json({ success: false, message: 'Article must have a category before submission' });
    }

    // Transition to pending review
    article.status = 'pending';
    article.rejectionFeedback = null;
    article.reviewedBy = null;

    await article.save();
    await article.populate('author', 'name email role profilePicture');

    res.status(200).json({
      success: true,
      message: 'Article submitted successfully for editorial review',
      article,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Approve a pending article for publication
 * @route   PUT /api/articles/:id/approve
 * @access  Private (Editor, Admin)
 */
export const approveArticle = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid article ID format' });
    }

    const article = await Article.findById(id);

    if (!article) {
      return res.status(404).json({ success: false, message: 'Article not found' });
    }

    // Must be in pending review state
    if (article.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot approve article with status '${article.status}'. Only pending articles can be approved.`,
      });
    }

    // Conflict of interest check: Editors cannot review their own articles (admins have broader permissions)
    if (req.user.role === 'admin' && article.author.toString() === req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Conflict of interest: Admins cannot review or approve their own articles.',
      });
    }

    // Update status to published
    article.status = 'published';
    article.publishedAt = new Date();
    article.reviewedBy = req.user._id;
    article.rejectionFeedback = null;

    await article.save();
    await article.populate('author', 'name email role profilePicture department');
    await article.populate('reviewedBy', 'name email role');

    res.status(200).json({
      success: true,
      message: 'Article approved and published to the campus feed successfully',
      article,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Reject a pending article with required editorial feedback
 * @route   PUT /api/articles/:id/reject
 * @access  Private (Editor, Admin)
 */
export const rejectArticle = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { feedback } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid article ID format' });
    }

    // Rejection feedback is mandatory
    if (!feedback || !feedback.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Editorial feedback is required when rejecting an article to guide the author.',
      });
    }

    const article = await Article.findById(id);

    if (!article) {
      return res.status(404).json({ success: false, message: 'Article not found' });
    }

    // Must be in pending review state
    if (article.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot reject article with status '${article.status}'. Only pending articles can be reviewed.`,
      });
    }

    // Conflict of interest check: Editors cannot review their own articles
    if (req.user.role === 'admin' && article.author.toString() === req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Conflict of interest: Admins cannot review or reject their own articles.',
      });
    }

    article.status = 'rejected';
    article.rejectionFeedback = feedback.trim();
    article.reviewedBy = req.user._id;

    await article.save();
    await article.populate('author', 'name email role profilePicture department');
    await article.populate('reviewedBy', 'name email role');

    res.status(200).json({
      success: true,
      message: 'Article returned to author with editorial revision feedback',
      article,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Withdraw a pending submission back to draft status
 * @route   PUT /api/articles/:id/withdraw
 * @access  Private (Author only)
 */
export const withdrawArticleSubmission = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid article ID format' });
    }

    const article = await Article.findById(id);

    if (!article) {
      return res.status(404).json({ success: false, message: 'Article not found' });
    }

    // Ownership check
    if (article.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You can only withdraw your own submissions',
      });
    }

    // Can only withdraw pending articles
    if (article.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Only pending submissions can be withdrawn to draft. Current status: '${article.status}'.`,
      });
    }

    article.status = 'draft';
    await article.save();

    res.status(200).json({
      success: true,
      message: 'Submission withdrawn. Article returned to draft status.',
      article,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get published articles feed
 * @route   GET /api/articles
 * @access  Public
 */
export const getPublishedArticles = async (req, res, next) => {
  try {
    const { category, search, sort = 'latest', page = 1, limit = 12 } = req.query;

    // Strictly enforce status = 'published'. Never expose drafts or pending articles!
    const query = { status: 'published' };

    if (category && category !== 'All') {
      query.category = { $regex: new RegExp(`^${category}$`, 'i') };
    }

    if (search && search.trim()) {
      const sanitized = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const searchRegex = new RegExp(sanitized, 'i');
      query.$or = [
        { title: searchRegex },
        { excerpt: searchRegex },
        { content: searchRegex },
      ];
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 12;
    const skip = (pageNum - 1) * limitNum;

    let sortOptions = { publishedAt: -1, createdAt: -1 };
    if (sort === 'popular') {
      sortOptions = { views: -1, publishedAt: -1 };
    } else if (sort === 'oldest') {
      sortOptions = { publishedAt: 1, createdAt: 1 };
    }

    const [articles, total] = await Promise.all([
      Article.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum)
        .populate('author', 'name email role profilePicture department'),
      Article.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limitNum);

    res.status(200).json({
      success: true,
      articles,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages,
        hasMore: pageNum < totalPages,
      },
    });
  } catch (error) {
    next(error);
  }
};
