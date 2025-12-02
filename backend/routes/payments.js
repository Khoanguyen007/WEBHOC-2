const express = require('express');
const { 
  generateVietQR, 
  quickEnrollWithQR,
  verifyQRPayment, 
  handleVietQRWebhook,
  getPaymentDetails,
  getQRPaymentHistory,
  getPaymentStats,
  getSupportedBanks,
  manualConfirmPayment,
  getCoursePaymentInfo
} = require('../controllers/qrPaymentController');
const { authMiddleware, isStudent, isAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

// ==================== QR PAYMENT ROUTES ====================
// Public
router.get('/course/:courseId/info', getCoursePaymentInfo);
router.get('/qr/banks', getSupportedBanks);
router.post('/qr/webhook', handleVietQRWebhook);

// Student
router.post('/qr/generate', authMiddleware, isStudent, generateVietQR);
router.post('/qr/quick-enroll', authMiddleware, isStudent, quickEnrollWithQR);
router.post('/qr/verify', authMiddleware, verifyQRPayment);
router.get('/qr/:paymentId', authMiddleware, getPaymentDetails);
router.get('/qr/history', authMiddleware, getQRPaymentHistory);

// Admin
router.get('/qr/stats', authMiddleware, isAdmin, getPaymentStats);
router.post('/qr/manual-confirm', authMiddleware, isAdmin, manualConfirmPayment);

module.exports = router;