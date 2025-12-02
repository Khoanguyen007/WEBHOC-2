const express = require('express');
const { createLesson, getLessonsByCourse, updateLesson } = require('../controllers/lessonController');
const { authMiddleware, isInstructor } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/courses/:courseId/lessons', authMiddleware, getLessonsByCourse);

router.post('/courses/:courseId/lessons', authMiddleware, isInstructor, createLesson);

router.post('/', authMiddleware, isInstructor, createLesson);

router.patch('/:id', authMiddleware, isInstructor, updateLesson);

module.exports = router;