const Lesson = require('../models/Lesson');
const Course = require('../models/Course');

// @desc    Create a new lesson
// @route   POST /v2/lessons/courses/:courseId/lessons
// @access  Private (Instructor)
const createLesson = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    
    // Check if course exists and user owns it
    const course = await Course.findOne({ _id: courseId, instructorId: req.user.id });
    if (!course) {
      return res.status(404).json({
        statusCode: 404,
        message: 'Course not found or you do not have permission'
      });
    }

    const lessonData = {
      ...req.body,
      courseId
    };

    const lesson = await Lesson.create(lessonData);
    res.status(201).json(lesson);
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

// @desc    Get lessons by course
// @route   GET /v2/lessons/courses/:courseId/lessons
// @access  Private
const getLessonsByCourse = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    
    const lessons = await Lesson.find({ 
      courseId, 
      isPublished: true 
    }).sort('order');

    res.json({
      data: lessons
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a lesson
// @route   PATCH /v2/lessons/:id
// @access  Private (Instructor)
const updateLesson = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Find the lesson and check ownership through course
    const lesson = await Lesson.findById(id);
    if (!lesson) {
      return res.status(404).json({
        statusCode: 404,
        message: 'Lesson not found'
      });
    }

    // Check if user owns the course that contains this lesson
    const course = await Course.findOne({ 
      _id: lesson.courseId, 
      instructorId: req.user.id 
    });
    
    if (!course) {
      return res.status(403).json({
        statusCode: 403,
        message: 'Forbidden: You do not own this lesson'
      });
    }

    const updatedLesson = await Lesson.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json(updatedLesson);
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
  createLesson,
  getLessonsByCourse,
  updateLesson // THÊM HÀM NÀY VÀO EXPORTS
};