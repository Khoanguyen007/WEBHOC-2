const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');

// @desc    Create a new quiz
// @route   POST /v2/quizzes/courses/:courseId
// @access  Private (Instructor)
const createQuiz = async (req, res, next) => {
  try {
    console.log('🎯 CREATE QUIZ CONTROLLER - START');
    console.log('📝 Request body received:', req.body);
    console.log('🔍 Request params:', req.params);
    console.log('👤 User:', req.user);

    const { courseId } = req.params;

    if (!req.body || Object.keys(req.body).length === 0) {
      console.log('❌ EMPTY REQUEST BODY');
      return res.status(400).json({
        statusCode: 400,
        message: 'Request body is empty'
      });
    }

    // Check if course exists and user owns it
    const course = await Course.findOne({ 
      _id: courseId, 
      instructorId: req.user.id 
    });
    
    if (!course) {
      console.log('❌ COURSE NOT FOUND OR NO PERMISSION');
      return res.status(404).json({
        statusCode: 404,
        message: 'Course not found or you do not have permission'
      });
    }

    console.log('✅ COURSE FOUND, CREATING QUIZ...');

    const quizData = {
      ...req.body,
      courseId
    };

    console.log('📦 Quiz data to save:', quizData);

    const quiz = await Quiz.create(quizData);
    
    console.log('✅ QUIZ CREATED SUCCESSFULLY:', quiz._id);

    res.status(201).json({
      statusCode: 201,
      message: 'Quiz created successfully',
      data: quiz
    });

  } catch (error) {
    console.error('💥 ERROR IN CREATE QUIZ:', error);
    next(error);
  }
};

// @desc    Get quizzes by course
// @route   GET /v2/quizzes/courses/:courseId
// @access  Private
const getQuizzesByCourse = async (req, res, next) => {
  try {
    const { courseId } = req.params;

    // Check if user is enrolled or is instructor
    const enrollment = await Enrollment.findOne({ 
      userId: req.user.id, 
      courseId, 
      paymentStatus: 'paid' 
    });
    
    const course = await Course.findById(courseId);
    const isInstructor = course && course.instructorId.toString() === req.user.id;

    if (!enrollment && !isInstructor) {
      return res.status(403).json({
        statusCode: 403,
        message: 'You are not enrolled in this course'
      });
    }

    const quizzes = await Quiz.find({ 
      courseId,
      isPublished: true 
    }).select('-questions.correctAnswer'); // Hide correct answers

    res.json({
      data: quizzes
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get quiz details (without answers for students, with answers for instructors)
// @route   GET /v2/quizzes/:id
// @access  Private
const getQuiz = async (req, res, next) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    
    if (!quiz) {
      return res.status(404).json({
        statusCode: 404,
        message: 'Quiz not found'
      });
    }

    // Check permissions
    const course = await Course.findById(quiz.courseId);
    const isInstructor = course && course.instructorId.toString() === req.user.id;
    const enrollment = await Enrollment.findOne({ 
      userId: req.user.id, 
      courseId: quiz.courseId, 
      paymentStatus: 'paid' 
    });

    if (!isInstructor && !enrollment) {
      return res.status(403).json({
        statusCode: 403,
        message: 'You are not enrolled in this course'
      });
    }

    // If student, hide correct answers
    if (!isInstructor) {
      const quizWithoutAnswers = quiz.toObject();
      quizWithoutAnswers.questions.forEach(question => {
        delete question.correctAnswer;
      });
      return res.json(quizWithoutAnswers);
    }

    res.json(quiz);
  } catch (error) {
    next(error);
  }
};

// @desc    Submit quiz attempt
// @route   POST /v2/quizzes/:id/attempt
// @access  Private
const submitQuizAttempt = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { answers, timeSpent } = req.body;

    const quiz = await Quiz.findById(id);
    if (!quiz) {
      return res.status(404).json({
        statusCode: 404,
        message: 'Quiz not found'
      });
    }

    // Check enrollment
    const enrollment = await Enrollment.findOne({ 
      userId: req.user.id, 
      courseId: quiz.courseId, 
      paymentStatus: 'paid' 
    });

    if (!enrollment) {
      return res.status(403).json({
        statusCode: 403,
        message: 'You are not enrolled in this course'
      });
    }

    // Check attempt limit
    const attemptCount = await QuizAttempt.countDocuments({ 
      userId: req.user.id, 
      quizId: id 
    });

    if (attemptCount >= quiz.maxAttempts) {
      return res.status(400).json({
        statusCode: 400,
        message: `Maximum attempts (${quiz.maxAttempts}) reached for this quiz`
      });
    }

    // Calculate score
    let correctAnswers = 0;
    let totalPoints = 0;
    let earnedPoints = 0;

    const detailedAnswers = answers.map((answer, index) => {
      const question = quiz.questions[index];
      const isCorrect = answer.selectedOption === question.correctAnswer;
      
      totalPoints += question.points;
      if (isCorrect) {
        correctAnswers++;
        earnedPoints += question.points;
      }

      return {
        questionIndex: index,
        selectedOption: answer.selectedOption,
        isCorrect
      };
    });

    const percentage = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
    const passed = percentage >= quiz.passingScore;

    // Save attempt
    const attempt = await QuizAttempt.create({
      userId: req.user.id,
      quizId: id,
      answers: detailedAnswers,
      score: earnedPoints,
      totalQuestions: quiz.questions.length,
      correctAnswers,
      percentage,
      passed,
      timeSpent: timeSpent || 0
    });

    res.status(201).json({
      attemptId: attempt._id,
      score: earnedPoints,
      totalPoints,
      correctAnswers,
      totalQuestions: quiz.questions.length,
      percentage,
      passed,
      passingScore: quiz.passingScore
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's quiz attempts
// @route   GET /v2/quizzes/me/attempts
// @access  Private
const getMyQuizAttempts = async (req, res, next) => {
  try {
    const attempts = await QuizAttempt.find({ userId: req.user.id })
      .populate('quizId', 'title courseId')
      .sort({ completedAt: -1 });

    res.json({
      data: attempts
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createQuiz,
  getQuizzesByCourse,
  getQuiz,
  submitQuizAttempt,
  getMyQuizAttempts
};