const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const validateWebhookSig = (req, res, next) => {
  const signature = req.headers['stripe-signature'];

  if (!signature) {
    return res.status(401).json({
      statusCode: 401,
      message: 'No Stripe signature found'
    });
  }

  try {
    req.stripeEvent = stripe.webhooks.constructEvent(
      req.rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
    next();
  } catch (error) {
    console.error('Webhook signature verification failed:', error.message);
    return res.status(401).json({
      statusCode: 401,
      message: 'Invalid webhook signature'
    });
  }
};

module.exports = {
  validateWebhookSig
};