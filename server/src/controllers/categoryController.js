import Category from '../models/Category.js';
import Article from '../models/Article.js';

export const DEFAULT_CATEGORIES = [
  {
    name: 'Technology',
    slug: 'technology',
    description: 'Emerging tech, gadgets, AI developments, and tech culture on campus.',
    iconName: 'Cpu',
    color: 'indigo',
    coverImage: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Programming',
    slug: 'programming',
    description: 'Coding tutorials, project architectures, algorithms, and developer tools.',
    iconName: 'Code',
    color: 'emerald',
    coverImage: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Campus Life',
    slug: 'campus-life',
    description: 'Hostel stories, cafeteria reviews, student clubs, and daily campus culture.',
    iconName: 'Coffee',
    color: 'amber',
    coverImage: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Academics',
    slug: 'academics',
    description: 'Study techniques, semester roadmaps, research papers, and lab survival guides.',
    iconName: 'GraduationCap',
    color: 'blue',
    coverImage: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Career & Placements',
    slug: 'career-placements',
    description: 'Internship diaries, placement interview questions, resumes, and alumni advice.',
    iconName: 'Briefcase',
    color: 'rose',
    coverImage: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Events',
    slug: 'events',
    description: 'College fests, hackathons, sports meets, cultural nights, and guest seminars.',
    iconName: 'Calendar',
    color: 'purple',
    coverImage: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Entertainment',
    slug: 'entertainment',
    description: 'Movie reviews, book recommendations, campus memes, and musical playlists.',
    iconName: 'Film',
    color: 'pink',
    coverImage: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Student Voice',
    slug: 'student-voice',
    description: 'Editorials, student council opinions, campus debates, and personal perspectives.',
    iconName: 'Heart',
    color: 'sky',
    coverImage: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=800&q=80',
  },
];

/**
 * @desc    Get all categories with dynamic count of published articles
 * @route   GET /api/categories
 * @access  Public
 */
export const getCategories = async (req, res, next) => {
  try {
    // Seed default categories if none exist in the database
    const totalExisting = await Category.countDocuments();
    if (totalExisting === 0) {
      await Category.insertMany(DEFAULT_CATEGORIES);
    }

    // Aggregate published article counts per category
    const articleCounts = await Article.aggregate([
      { $match: { status: 'published' } },
      { $group: { _id: { $toLower: '$category' }, count: { $sum: 1 } } },
    ]);

    const countMap = {};
    articleCounts.forEach((item) => {
      if (item._id) {
        countMap[item._id] = item.count;
      }
    });

    const categories = await Category.find().sort({ name: 1 });

    const categoriesWithCounts = categories.map((cat) => {
      const obj = cat.toObject();
      obj.articleCount = countMap[cat.name.toLowerCase()] || 0;
      return obj;
    });

    res.status(200).json({
      success: true,
      count: categoriesWithCounts.length,
      categories: categoriesWithCounts,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new category
 * @route   POST /api/categories
 * @access  Private (Admin only)
 */
export const createCategory = async (req, res, next) => {
  try {
    const { name, description, iconName, color, coverImage } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Category name is required' });
    }

    const trimmedName = name.trim();
    const slug = trimmedName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const existingCategory = await Category.findOne({
      $or: [{ name: new RegExp(`^${trimmedName}$`, 'i') }, { slug }],
    });

    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: `Category "${trimmedName}" already exists`,
      });
    }

    const category = await Category.create({
      name: trimmedName,
      slug,
      description: description ? description.trim() : 'Student-contributed topic stream.',
      iconName: iconName || 'BookOpen',
      color: color || 'indigo',
      coverImage: coverImage || 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
    });

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      category: {
        ...category.toObject(),
        articleCount: 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a category
 * @route   DELETE /api/categories/:id
 * @access  Private (Admin only)
 */
export const deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    await Category.deleteOne({ _id: id });

    res.status(200).json({
      success: true,
      message: 'Category deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
