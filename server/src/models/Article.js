import mongoose from 'mongoose';

const articleSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide an article title'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    excerpt: {
      type: String,
      required: [true, 'Please provide a short excerpt'],
      trim: true,
      maxlength: [500, 'Excerpt cannot exceed 500 characters'],
    },
    content: {
      type: String,
      required: [true, 'Please provide article content'],
    },
    coverImage: {
      type: String,
      default: '',
      trim: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Article must have an author'],
      index: true,
    },
    category: {
      type: String,
      required: [true, 'Please select an article category'],
      trim: true,
      index: true,
    },
    status: {
      type: String,
      enum: {
        values: ['draft', 'pending', 'published', 'rejected'],
        message: '{VALUE} is not a valid article status',
      },
      default: 'draft',
      index: true,
    },
    rejectionFeedback: {
      type: String,
      default: null,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    publishedAt: {
      type: Date,
      default: null,
    },
    views: {
      type: Number,
      default: 0,
      min: 0,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for querying published articles by category and date
articleSchema.index({ status: 1, category: 1, publishedAt: -1 });
articleSchema.index({ status: 1, views: -1, publishedAt: -1 });

// Text index for full-text search capability
articleSchema.index({ title: 'text', excerpt: 'text', content: 'text' });

const Article = mongoose.model('Article', articleSchema);

export default Article;
