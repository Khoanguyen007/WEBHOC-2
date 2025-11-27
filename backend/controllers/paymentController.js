const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const paypal = require('paypal-rest-sdk');
const Enrollment = require('../models/Enrollment'); // CHỈ KHAI BÁO 1 LẦN
const Course = require('../models/Course');
const Payment = require('../models/Payment'); // THÊM DÒNG NÀY
const User = require('../models/User');
const { generateInvoice, sendInvoiceEmail } = require('../utils/invoiceService');

// Configure PayPal SDK
paypal.configure({
  mode: process.env.PAYPAL_MODE || 'sandbox', // sandbox or live
  client_id: process.env.PAYPAL_CLIENT_ID,
  client_secret: process.env.PAYPAL_CLIENT_SECRET
});

/**
 * Helper function to generate and send invoice after payment
 */
const handlePostPaymentInvoice = async (payment, enrollment, user, course) => {
  try {
    // Generate invoice number based on payment ID
    const invoiceNumber = `WH-${new Date().getFullYear()}-${payment._id.toString().slice(-6).toUpperCase()}`;
    
    // Generate PDF invoice
    const invoicePath = await generateInvoice({
      invoiceNumber,
      user,
      course,
      payment,
      paymentMethod: payment.paymentMethod,
      date: new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
    });

    // Send invoice email
    await sendInvoiceEmail({
      userEmail: user.email,
      userName: user.displayName || user.email,
      courseName: course.title,
      invoiceNumber,
      invoicePath,
      amountUSD: (payment.amountCents / 100).toFixed(2)
    });

    // Update payment with invoice URL
    payment.invoiceNumber = invoiceNumber;
    await payment.save();

    console.log(`✅ Invoice generated and sent: ${invoiceNumber}`);
  } catch (err) {
    console.error('❌ Error generating/sending invoice:', err);
    // Don't throw - invoice generation shouldn't fail the payment
  }
};

// @desc    Create Stripe checkout session
// @route   POST /v2/payments/checkout
// @access  Private (Student)
const createCheckoutSession = async (req, res, next) => {
  try {
    const { courseId } = req.body;
    const userId = req.user.id;

    if (!courseId) {
      return res.status(400).json({
        statusCode: 400,
        message: 'Course ID is required'
      });
    }

    // Fetch the course
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        statusCode: 404,
        message: 'Course not found'
      });
    }

    // Check if course is free
    if (course.priceCents === 0 || !course.priceCents) {
      // For free courses, create enrollment directly
      let enrollment = await Enrollment.findOne({
        userId: userId,
        courseId: courseId
      });

      if (!enrollment) {
        enrollment = await Enrollment.create({
          userId: userId,
          courseId: courseId,
          paymentStatus: 'paid',
          enrolledAt: new Date()
        });
      }

      return res.json({
        checkoutUrl: null,
        sessionId: null,
        message: 'Free course enrollment successful'
      });
    }

    // Check if user already enrolled
    const existingEnrollment = await Enrollment.findOne({
      userId: userId,
      courseId: courseId,
      paymentStatus: 'paid'
    });

    if (existingEnrollment) {
      return res.status(400).json({
        statusCode: 400,
        message: 'You are already enrolled in this course'
      });
    }

    // Create or get pending enrollment
    let enrollment = await Enrollment.findOneAndUpdate(
      { userId: userId, courseId: courseId, paymentStatus: 'pending' },
      {
        userId: userId,
        courseId: courseId,
        paymentStatus: 'pending',
        enrolledAt: new Date()
      },
      { upsert: true, new: true }
    );

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: course.title,
              description: course.description ? course.description.substring(0, 200) : 'Online Course',
              images: course.coverImageUrl ? [course.coverImageUrl] : [],
            },
            unit_amount: Math.round(course.priceCents),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.CLIENT_URL}/payment-result?status=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/payment-result?status=cancel`,
      metadata: {
        enrollmentId: enrollment._id.toString(),
        courseId: courseId,
        userId: userId,
      },
    });

    res.json({
      checkoutUrl: session.url,
      sessionId: session.id
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create PayPal payment
// @route   POST /v2/payments/paypal/checkout
// @access  Private (Student)
const createPayPalCheckout = async (req, res, next) => {
  try {
    const { courseId } = req.body;
    const userId = req.user.id;

    if (!courseId) {
      return res.status(400).json({
        statusCode: 400,
        message: 'Course ID is required'
      });
    }

    // Fetch the course
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        statusCode: 404,
        message: 'Course not found'
      });
    }

    // Check if course is free
    if (course.priceCents === 0 || !course.priceCents) {
      let enrollment = await Enrollment.findOne({
        userId: userId,
        courseId: courseId
      });

      if (!enrollment) {
        enrollment = await Enrollment.create({
          userId: userId,
          courseId: courseId,
          paymentStatus: 'paid',
          enrolledAt: new Date()
        });
      }

      return res.json({
        approvalUrl: null,
        message: 'Free course enrollment successful'
      });
    }

    // Check if user already enrolled
    const existingEnrollment = await Enrollment.findOne({
      userId: userId,
      courseId: courseId,
      paymentStatus: 'paid'
    });

    if (existingEnrollment) {
      return res.status(400).json({
        statusCode: 400,
        message: 'You are already enrolled in this course'
      });
    }

    // Create or get pending enrollment
    let enrollment = await Enrollment.findOneAndUpdate(
      { userId: userId, courseId: courseId, paymentStatus: 'pending' },
      {
        userId: userId,
        courseId: courseId,
        paymentStatus: 'pending',
        enrolledAt: new Date()
      },
      { upsert: true, new: true }
    );

    // Create PayPal payment
    const payment = {
      intent: 'sale',
      payer: {
        payment_method: 'paypal'
      },
      redirect_urls: {
        return_url: `${process.env.CLIENT_URL}/payment-result?status=success&paypalPaymentId={paymentId}`,
        cancel_url: `${process.env.CLIENT_URL}/payment-result?status=cancel`
      },
      transactions: [
        {
          description: course.title,
          amount: {
            currency: 'USD',
            total: (course.priceCents / 100).toFixed(2),
            details: {
              subtotal: (course.priceCents / 100).toFixed(2),
              tax: '0.00',
              shipping: '0.00'
            }
          },
          item_list: {
            items: [
              {
                name: course.title,
                description: course.description ? course.description.substring(0, 200) : 'Online Course',
                quantity: 1,
                price: (course.priceCents / 100).toFixed(2),
                currency: 'USD'
              }
            ]
          },
          custom: JSON.stringify({
            enrollmentId: enrollment._id.toString(),
            courseId: courseId,
            userId: userId
          })
        }
      ]
    };

    paypal.payment.create(payment, (error, payment) => {
      if (error) {
        console.error('❌ PayPal error:', error);
        return next(error);
      } else {
        // Get approval URL
        const approvalUrl = payment.links.find(link => link.rel === 'approval_url');
        if (approvalUrl) {
          res.json({
            approvalUrl: approvalUrl.href
          });
        } else {
          res.status(500).json({
            statusCode: 500,
            message: 'Failed to create PayPal payment'
          });
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Execute PayPal payment
// @route   POST /v2/payments/paypal/execute
// @access  Private (Student)
const executePayPalPayment = async (req, res, next) => {
  try {
    const { paymentId, payerId } = req.body;

    if (!paymentId || !payerId) {
      return res.status(400).json({
        statusCode: 400,
        message: 'Payment ID and Payer ID are required'
      });
    }

    paypal.payment.execute(paymentId, { payer_id: payerId }, async (error, payment) => {
      if (error) {
        console.error('❌ PayPal execution error:', error);
        return res.status(400).json({
          statusCode: 400,
          message: 'Failed to execute PayPal payment'
        });
      } else {
        try {
          // Get transaction details
          const transaction = payment.transactions[0];
          const customData = JSON.parse(transaction.custom);
          const { enrollmentId, userId } = customData;

          // Update enrollment
          const enrollment = await Enrollment.findById(enrollmentId);
          if (enrollment && enrollment.paymentStatus === 'pending') {
            enrollment.paymentStatus = 'paid';
            await enrollment.save();

            // Create payment record
            const paymentRecord = await Payment.create({
              enrollmentId: enrollment._id,
              userId: userId,
              amountCents: Math.round(parseFloat(transaction.amount.total) * 100),
              currency: transaction.amount.currency,
              status: 'completed',
              transactionId: paymentId,
              paymentMethod: 'paypal'
            });

            console.log(`✅ PayPal payment completed for enrollment: ${enrollmentId}`);

            // Generate and send invoice asynchronously (don't wait)
            try {
              const user = await User.findById(userId);
              const course = await Course.findById(enrollment.courseId);
              if (user && course) {
                handlePostPaymentInvoice(paymentRecord, enrollment, user, course);
              }
            } catch (invoiceErr) {
              console.error('Invoice generation failed (non-blocking):', invoiceErr);
            }
          }

          res.json({
            status: 'success',
            message: 'Payment completed successfully',
            enrollmentId: enrollmentId
          });
        } catch (dbError) {
          console.error('❌ Database error:', dbError);
          next(dbError);
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Handle Stripe webhook
// @route   POST /v2/payments/webhook
// @access  Public (Stripe only)
const handleWebhook = async (req, res, next) => {
  try {
    const event = req.stripeEvent;

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      
      // Tìm enrollment và cập nhật trạng thái
      const enrollment = await Enrollment.findById(session.metadata.enrollmentId);
      if (enrollment && enrollment.paymentStatus === 'pending') {
        enrollment.paymentStatus = 'paid';
        await enrollment.save();

        // Tạo payment record
        const payment = await Payment.create({
          enrollmentId: enrollment._id,
          userId: enrollment.userId,
          amountCents: session.amount_total,
          currency: session.currency.toUpperCase(),
          status: 'completed',
          transactionId: session.id,
          paymentMethod: 'stripe'
        });

        console.log(`✅ Payment completed for enrollment: ${enrollment._id}`);

        // Generate and send invoice asynchronously (don't wait)
        try {
          const user = await User.findById(enrollment.userId);
          const course = await Course.findById(enrollment.courseId);
          if (user && course) {
            handlePostPaymentInvoice(payment, enrollment, user, course);
          }
        } catch (invoiceErr) {
          console.error('Invoice generation failed (non-blocking):', invoiceErr);
        }
      }
    }

    res.json({ received: true });
  } catch (error) {
    console.error('❌ Webhook error:', error);
    next(error);
  }
};

// @desc    Get invoice download URL for a payment
// @route   GET /v2/payments/invoice/:paymentId
// @access  Private (Own payment only)
const getInvoiceUrl = async (req, res, next) => {
  try {
    const { paymentId } = req.params;
    const userId = req.user.id;

    // Find payment
    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({
        statusCode: 404,
        message: 'Payment not found'
      });
    }

    // Verify ownership
    if (payment.userId.toString() !== userId) {
      return res.status(403).json({
        statusCode: 403,
        message: 'Unauthorized to access this payment'
      });
    }

    // Check if payment is completed
    if (payment.status !== 'completed') {
      return res.status(400).json({
        statusCode: 400,
        message: 'Invoice only available for completed payments'
      });
    }

    // Return invoice info
    res.json({
      invoiceNumber: payment.invoiceNumber,
      downloadUrl: `/v2/payments/invoice/${paymentId}/download`,
      createdAt: payment.createdAt
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Download invoice PDF
// @route   GET /v2/payments/invoice/:paymentId/download
// @access  Private (Own payment only)
const downloadInvoice = async (req, res, next) => {
  try {
    const { paymentId } = req.params;
    const userId = req.user.id;

    // Find payment
    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({
        statusCode: 404,
        message: 'Payment not found'
      });
    }

    // Verify ownership
    if (payment.userId.toString() !== userId) {
      return res.status(403).json({
        statusCode: 403,
        message: 'Unauthorized to access this payment'
      });
    }

    // Check if invoice exists
    if (!payment.invoiceNumber) {
      return res.status(404).json({
        statusCode: 404,
        message: 'Invoice not available for this payment'
      });
    }

    // Build file path
    const path = require('path');
    const invoicesDir = path.join(__dirname, '../invoices');
    const filename = `invoice_${payment.invoiceNumber}.pdf`;
    const filepath = path.join(invoicesDir, filename);

    // Check if file exists
    const fs = require('fs');
    if (!fs.existsSync(filepath)) {
      return res.status(404).json({
        statusCode: 404,
        message: 'Invoice file not found'
      });
    }

    // Send file
    res.download(filepath, filename);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createCheckoutSession,
  createPayPalCheckout,
  executePayPalPayment,
  handleWebhook,
  getInvoiceUrl,
  downloadInvoice
};