const express = require('express');
const { updateLessonProgress, getCourseProgress } = require('../controllers/progressController');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/lessons/:lessonId', authMiddleware, updateLessonProgress);
router.get('/courses/:courseId', authMiddleware, getCourseProgress);

module.exports = router;