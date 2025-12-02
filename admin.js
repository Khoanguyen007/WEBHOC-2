const express = require('express');
const { authMiddleware, isAdmin } = require('../middleware/authMiddleware');
const User = require('../models/User');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');

const router = express.Router();

// Admin stats
router.get('/stats', authMiddleware, isAdmin, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalCourses = await Course.countDocuments();
    const totalEnrollments = await Enrollment.countDocuments();
    const revenue = await Enrollment.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $lookup: { from: 'courses', localField: 'courseId', foreignField: '_id', as: 'course' } },
      { $unwind: '$course' },
      { $group: { _id: null, total: { $sum: '$course.priceCents' } } }
    ]);

    res.json({
      totalUsers,
      totalCourses,
      totalEnrollments,
      totalRevenue: revenue[0]?.total || 0
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;