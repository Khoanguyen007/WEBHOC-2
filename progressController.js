const Progress = require('../models/Progress');
const Lesson = require('../models/Lesson');
const Enrollment = require('../models/Enrollment');

// @desc    Update lesson progress
// @route   POST /v2/progress/lessons/:lessonId
// @access  Private
const updateLessonProgress = async (req, res, next) => {
  try {
    const { lessonId } = req.params;
    const { completed, timeSpent, lastPosition } = req.body;

    // Find the lesson to get courseId
    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
      return res.status(404).json({
        statusCode: 404,
        message: 'Lesson not found'
      });
    }

    // Check if user is enrolled in the course
    const enrollment = await Enrollment.findOne({
      userId: req.user.id,
      courseId: lesson.courseId,
      paymentStatus: 'paid'
    });

    if (!enrollment) {
      return res.status(403).json({
        statusCode: 403,
        message: 'You are not enrolled in this course'
      });
    }

    // Update or create progress
    const progress = await Progress.findOneAndUpdate(
      {
        userId: req.user.id,
        courseId: lesson.courseId,
        lessonId: lessonId
      },
      {
        completed: completed || false,
        timeSpent: timeSpent || 0,
        lastPosition: lastPosition || 0,
        completedAt: completed ? new Date() : null
      },
      { 
        new: true, 
        upsert: true,
        runValidators: true 
      }
    );

    // Calculate overall course progress
    await updateCourseProgress(req.user.id, lesson.courseId);

    res.json(progress);
  } catch (error) {
    next(error);
  }
};

// @desc    Get course progress
// @route   GET /v2/progress/courses/:courseId
// @access  Private
const getCourseProgress = async (req, res, next) => {
  try {
    const { courseId } = req.params;

    // Check enrollment
    const enrollment = await Enrollment.findOne({
      userId: req.user.id,
      courseId: courseId,
      paymentStatus: 'paid'
    });

    if (!enrollment) {
      return res.status(403).json({
        statusCode: 403,
        message: 'You are not enrolled in this course'
      });
    }

    // Get all lessons in the course
    const lessons = await Lesson.find({ 
      courseId: courseId,
      isPublished: true 
    });

    // Get progress for all lessons
    const progressRecords = await Progress.find({
      userId: req.user.id,
      courseId: courseId
    });

    // Calculate statistics
    const totalLessons = lessons.length;
    const completedLessons = progressRecords.filter(p => p.completed).length;
    const completionPercentage = totalLessons > 0 
      ? Math.round((completedLessons / totalLessons) * 100) 
      : 0;

    // Update enrollment progress
    enrollment.completionPercentage = completionPercentage;
    await enrollment.save();

    res.json({
      courseId,
      totalLessons,
      completedLessons,
      completionPercentage,
      lessons: lessons.map(lesson => {
        const progress = progressRecords.find(p => p.lessonId.toString() === lesson._id.toString());
        return {
          lessonId: lesson._id,
          title: lesson.title,
          order: lesson.order,
          completed: progress ? progress.completed : false,
          timeSpent: progress ? progress.timeSpent : 0,
          lastPosition: progress ? progress.lastPosition : 0
        };
      })
    });
  } catch (error) {
    next(error);
  }
};

// Helper function to update course progress in enrollment
const updateCourseProgress = async (userId, courseId) => {
  const lessons = await Lesson.find({ courseId, isPublished: true });
  const progressRecords = await Progress.find({ userId, courseId, completed: true });
  
  const completionPercentage = lessons.length > 0 
    ? Math.round((progressRecords.length / lessons.length) * 100) 
    : 0;

  await Enrollment.findOneAndUpdate(
    { userId, courseId },
    { completionPercentage }
  );
};

module.exports = {
  updateLessonProgress,
  getCourseProgress
};