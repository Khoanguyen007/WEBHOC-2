const express = require('express');
const { 
  getCourses, 
  getCourse, 
  createCourse, 
  updateCourse 
} = require('../controllers/courseController');
const { authMiddleware, isInstructor } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', getCourses);
router.get('/:id', getCourse);
router.post('/', authMiddleware, isInstructor, createCourse);
router.patch('/:id', authMiddleware, isInstructor, updateCourse);

module.exports = router;