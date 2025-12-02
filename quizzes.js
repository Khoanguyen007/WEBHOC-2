const express = require('express');
const { 
  createQuiz, 
  getQuizzesByCourse, 
  getQuiz, 
  submitQuizAttempt, 
  getMyQuizAttempts,
  updateQuiz 
} = require('../controllers/quizController');
const { authMiddleware, isInstructor } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/courses/:courseId', authMiddleware, isInstructor, createQuiz);
router.post('/', authMiddleware, isInstructor, createQuiz);
router.get('/courses/:courseId', authMiddleware, getQuizzesByCourse);
router.get('/:id', authMiddleware, getQuiz);
router.patch('/:id', authMiddleware, isInstructor, updateQuiz);
router.post('/:id/attempt', authMiddleware, submitQuizAttempt);
router.get('/me/attempts', authMiddleware, getMyQuizAttempts);

module.exports = router;