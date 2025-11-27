const express = require('express');
const { generatePresignedUrl } = require('../controllers/fileController');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/upload-request', authMiddleware, generatePresignedUrl);

module.exports = router;