const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');

// @desc    Enroll in a course
// @route   POST /v2/enrollments/courses/:id/enroll
// @access  Private (Student)
const enrollInCourse = async (req, res, next) => {
  try {
    const courseId = req.params.id;
    const userId = req.user.id;

    const course = await Course.findOne({ _id: courseId, deletedAt: null });
    if (!course) {
      return res.status(404).json({
        statusCode: 404,
        message: 'Course not found'
      });
    }

    // Check if already enrolled
    const existingEnrollment = await Enrollment.findOne({ userId, courseId });
    if (existingEnrollment) {
      return res.status(409).json({
        statusCode: 409,
        message: 'Already enrolled in this course'
      });
    }

    // Create enrollment
    const enrollment = await Enrollment.create({
      userId,
      courseId,
      paymentStatus: course.priceCents > 0 ? 'pending' : 'paid'
    });

    // Populate course details
    await enrollment.populate('courseId', 'title description coverImageUrl instructorId');

    res.status(201).json(enrollment);
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's enrollments
// @route   GET /v2/enrollments/me/enrollments
// @access  Private
const getUserEnrollments = async (req, res, next) => {
  try {
    const enrollments = await Enrollment.find({ userId: req.user.id })
      .populate('courseId', 'title description coverImageUrl instructorId category difficultyLevel priceCents')
      .sort({ enrollmentDate: -1 });

    res.json({
      data: enrollments
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  enrollInCourse,
  getUserEnrollments
};