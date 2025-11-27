const express = require('express');
const { 
  createQuiz, 
  getQuizzesByCourse, 
  getQuiz, 
  submitQuizAttempt, 
  getMyQuizAttempts 
} = require('../controllers/quizController');
const { authMiddleware, isInstructor } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/courses/:courseId', authMiddleware, isInstructor, createQuiz);
router.get('/courses/:courseId', authMiddleware, getQuizzesByCourse);
router.get('/:id', authMiddleware, getQuiz);
router.post('/:id/attempt', authMiddleware, submitQuizAttempt);
router.get('/me/attempts', authMiddleware, getMyQuizAttempts);

module.exports = router;