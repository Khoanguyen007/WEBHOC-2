const express = require('express');
const { createCheckoutSession, createPayPalCheckout, executePayPalPayment, handleWebhook, getInvoiceUrl, downloadInvoice } = require('../controllers/paymentController');
const { authMiddleware, isStudent } = require('../middleware/authMiddleware');
const { validateWebhookSig } = require('../middleware/webhookMiddleware');

const router = express.Router();

// Stripe routes
router.post('/checkout', authMiddleware, isStudent, createCheckoutSession);

// PayPal routes
router.post('/paypal/checkout', authMiddleware, isStudent, createPayPalCheckout);
router.post('/paypal/execute', authMiddleware, isStudent, executePayPalPayment);

// Invoice routes
router.get('/invoice/:paymentId', authMiddleware, getInvoiceUrl);
router.get('/invoice/:paymentId/download', authMiddleware, downloadInvoice);

// Webhook route (for Stripe)
router.post('/webhook', validateWebhookSig, handleWebhook);

module.exports = router;