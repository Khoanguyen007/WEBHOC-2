const Course = require('../models/Course');

// @desc    Get all courses
// @route   GET /v2/courses
// @access  Public
const getCourses = async (req, res, next) => {
  try {
    const {
      page = 1,
      per_page = 10,
      search,
      category,
      difficulty,
      instructorId,
      sortBy = 'createdAt',
      order = 'desc'
    } = req.query;

    // Build query
    const query = { deletedAt: null };

    // Full-text search if search parameter provided
    if (search) {
      query.$text = { $search: search };
    }

    // Other filters
    if (category) query.category = new RegExp(category, 'i');
    if (difficulty) query.difficultyLevel = difficulty;
    if (instructorId) query.instructorId = instructorId;

    // Pagination
    const limit = parseInt(per_page);
    const skip = (parseInt(page) - 1) * limit;

    // Sort
    const sort = {};
    
    // If searching, prioritize text relevance
    if (search) {
      sort.score = { $meta: 'textScore' };
    } else {
      sort[sortBy] = order === 'asc' ? 1 : -1;
    }

    // Build find options
    const findOptions = {};
    if (search) {
      findOptions.score = { $meta: 'textScore' };
    }

    const courses = await Course.find(query, findOptions)
      .populate('instructorId', 'displayName profileImageUrl')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const total = await Course.countDocuments(query);

    res.json({
      data: courses,
      meta: {
        total,
        page: parseInt(page),
        per_page: limit,
        totalPages: Math.ceil(total / limit),
        search: search || null
      }
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Get single course
// @route   GET /v2/courses/:id
// @access  Public
const getCourse = async (req, res, next) => {
  try {
    const course = await Course.findOne({ 
      _id: req.params.id, 
      deletedAt: null 
    }).populate('instructorId', 'displayName profileImageUrl bio');

    if (!course) {
      return res.status(404).json({
        statusCode: 404,
        message: 'Course not found'
      });
    }

    res.json(course);

  } catch (error) {
    next(error);
  }
};

// @desc    Create new course
// @route   POST /v2/courses
// @access  Private (Instructor)
const createCourse = async (req, res, next) => {
  try {
    const courseData = {
      ...req.body,
      instructorId: req.user.id
    };

    const course = await Course.create(courseData);

    res.status(201).json(course);

  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        statusCode: 400,
        message: 'Validation error',
        details: messages
      });
    }
    next(error);
  }
};

// @desc    Update course
// @route   PATCH /v2/courses/:id
// @access  Private (Instructor - course owner)
const updateCourse = async (req, res, next) => {
  try {
    let course = await Course.findOne({ 
      _id: req.params.id, 
      deletedAt: null 
    });

    if (!course) {
      return res.status(404).json({
        statusCode: 404,
        message: 'Course not found'
      });
    }

    // Check ownership
    if (course.instructorId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        statusCode: 403,
        message: 'Forbidden: You do not own this course'
      });
    }

    course = await Course.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('instructorId', 'displayName profileImageUrl');

    res.json(course);

  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        statusCode: 400,
        message: 'Validation error',
        details: messages
      });
    }
    next(error);
  }
};

module.exports = {
  getCourses,
  getCourse,
  createCourse,
  updateCourse
};