const express = require('express');
const { enrollInCourse, getUserEnrollments, getEnrollmentsByCourse } = require('../controllers/enrollmentController');
const { authMiddleware, isStudent, isInstructor } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/courses/:id/enroll', authMiddleware, isStudent, enrollInCourse);
router.get('/me/enrollments', authMiddleware, getUserEnrollments);
router.get('/courses/:courseId', authMiddleware, isInstructor, getEnrollmentsByCourse);

module.exports = router;