const express = require('express');
const { enrollInCourse, getUserEnrollments } = require('../controllers/enrollmentController');
const { authMiddleware, isStudent } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/courses/:id/enroll', authMiddleware, isStudent, enrollInCourse);
router.get('/me/enrollments', authMiddleware, getUserEnrollments);

module.exports = router;