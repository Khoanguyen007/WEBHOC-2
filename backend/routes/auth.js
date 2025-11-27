const express = require('express');
const { signup, login, refresh, logout, verifyEmail } = require('../controllers/authController');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/refresh', refresh);
router.post('/logout', authMiddleware, logout);
router.post('/verify', verifyEmail);

module.exports = router;