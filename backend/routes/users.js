const express = require('express');
const { getUserProfile, updateUserProfile } = require('../controllers/userController');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/me', authMiddleware, getUserProfile);
router.patch('/me', authMiddleware, updateUserProfile);

module.exports = router;