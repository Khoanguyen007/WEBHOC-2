const Enrollment = require('../models/Enrollment');
const Payment = require('../models/Payment');
const Course = require('../models/Course');
const User = require('../models/User');
const vietQRService = require('../utils/vietQRService');

// Helper function để tạo invoice
const handlePostPaymentInvoice = async (payment, enrollment, user, course) => {
  try {
    // Generate invoice number based on payment ID
    const invoiceNumber = `WH-${new Date().getFullYear()}-${payment._id.toString().slice(-6).toUpperCase()}`;
    
    // Generate PDF invoice
    const { generateInvoice, sendInvoiceEmail } = require('../utils/invoiceService');
    
    const invoicePath = await generateInvoice({
      invoiceNumber,
      user,
      course,
      payment,
      paymentMethod: payment.paymentMethod,
      date: new Date().toLocaleDateString('vi-VN', { 
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
      amountVND: (payment.amountCents / 100).toLocaleString('vi-VN')
    });

    // Update payment with invoice URL
    payment.invoiceNumber = invoiceNumber;
    await payment.save();

    console.log(`✅ Invoice generated and sent: ${invoiceNumber}`);
  } catch (err) {
    console.error('❌ Error generating/sending invoice:', err);
  }
};

/**
 * Generate VietQR code for payment (Simplified version)
 */
const generateVietQR = async (req, res) => {
  try {
    const { amount, description } = req.body;
    const userId = req.userId;

    // Basic validation
    if (!amount || !description) {
      return res.status(400).json({
        success: false,
        message: 'Amount and description are required'
      });
    }

    // Generate transaction ID
    const transactionId = `QR${Date.now()}${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    // MB Bank account info
    const bankAccount = {
      bankCode: 'MB',
      accountNumber: process.env.MB_ACCOUNT_NUMBER || '0987654321',
      accountName: process.env.MB_ACCOUNT_NAME || 'WEBHOC EDUCATION',
      bankName: 'MB Bank'
    };

    // Create QR content
    const qrContent = `Ngân hàng: ${bankAccount.bankName}
        Số TK: ${bankAccount.accountNumber}
        Số tiền: ${amount} VND
        Nội dung: ${description}
        Mã GD: ${transactionId}`;

    // Generate QR image
    const qrImage = await QRCode.toDataURL(qrContent);

    // Save payment to database
    const payment = new Payment({
      userId,
      transactionId,
      amount,
      paymentMethod: 'vietqr',
      status: 'pending',
      gatewayResponse: {
        qrContent,
        qrImage,
        bankInfo: bankAccount
      },
      expiresAt: new Date(Date.now() + 15 * 60 * 1000)
    });

    await payment.save();

    // Return response
    res.status(200).json({
      success: true,
      message: 'QR code generated',
      data: {
        paymentId: payment._id,
        transactionId,
        qrImage,
        bankAccount,
        amount,
        description,
        expiryTime: payment.expiresAt
      }
    });

  } catch (error) {
    console.error('Generate VietQR error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate QR code',
      error: error.message
    });
  }
};

/**
 * Quick enroll with QR payment (Simplified version)
 */
const quickEnrollWithQR = async (req, res) => {
  try {
    const { courseId } = req.body;
    const userId = req.userId;

    // Validation
    if (!courseId) {
      return res.status(400).json({
        success: false,
        message: 'Course ID is required'
      });
    }

    // Get course
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Check existing enrollment
    const existingEnrollment = await Enrollment.findOne({
      userId,
      courseId,
      paymentStatus: 'paid'
    });

    if (existingEnrollment) {
      return res.status(400).json({
        success: false,
        message: 'Already enrolled in this course'
      });
    }

    // Create enrollment
    const enrollment = new Enrollment({
      userId,
      courseId,
      paymentStatus: 'pending'
    });

    // Generate transaction ID
    const transactionId = `ENROLL${Date.now()}${crypto.randomBytes(4).toString('hex')}`;

    // Bank info
    const bankAccount = {
      bankCode: 'MB',
      accountNumber: process.env.MB_ACCOUNT_NUMBER || '0987654321',
      accountName: process.env.MB_ACCOUNT_NAME || 'WEBHOC EDUCATION',
      bankName: 'MB Bank'
    };

    // Create QR
    const description = `Payment for course: ${course.title}`;
    const qrContent = `Bank: ${bankAccount.bankName}\nAccount: ${bankAccount.accountNumber}\nAmount: ${course.price} VND\nDescription: ${description}`;
    const qrImage = await QRCode.toDataURL(qrContent);

    // Create payment
    const payment = new Payment({
      userId,
      transactionId,
      amount: course.price,
      paymentMethod: 'vietqr',
      status: 'pending',
      enrollmentId: enrollment._id,
      gatewayResponse: {
        qrContent,
        qrImage,
        bankInfo: bankAccount
      },
      expiresAt: new Date(Date.now() + 30 * 60 * 1000)
    });

    // Save both
    await enrollment.save();
    await payment.save();

    // Link enrollment to payment
    enrollment.paymentId = payment._id;
    await enrollment.save();

    // Response
    res.status(200).json({
      success: true,
      message: 'Enrollment created. Please pay with QR code',
      data: {
        enrollmentId: enrollment._id,
        paymentId: payment._id,
        transactionId,
        course: {
          title: course.title,
          price: course.price
        },
        qrImage,
        bankAccount,
        expiryTime: payment.expiresAt
      }
    });

  } catch (error) {
    console.error('Quick enroll QR error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process enrollment',
      error: error.message
    });
  }
};

/**
 * Handle VietQR webhook for automatic payment confirmation
 * This endpoint receives notifications from VietQR/bank when payment is completed
 */
const handleVietQRWebhook = async (req, res) => {
  let webhookId = `WH${Date.now()}${crypto.randomBytes(2).toString('hex')}`;
  
  try {
    console.log(`📥 Webhook ${webhookId} received:`, {
      method: req.method,
      headers: req.headers,
      body: req.body,
      ip: req.ip,
      timestamp: new Date().toISOString()
    });

    // ============ VERIFY WEBHOOK SIGNATURE ============
    const signatureValid = verifyWebhookSignature(req);
    if (!signatureValid) {
      console.warn(`❌ Invalid signature for webhook ${webhookId}`);
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid webhook signature',
        webhookId
      });
    }

    // ============ VALIDATE WEBHOOK DATA ============
    const webhookData = req.body;
    const validationResult = validateWebhookData(webhookData);
    
    if (!validationResult.valid) {
      console.warn(`❌ Invalid webhook data: ${validationResult.error}`);
      return res.status(400).json({ 
        success: false, 
        message: validationResult.error,
        webhookId
      });
    }

    // ============ EXTRACT WEBHOOK DATA ============
    const { 
      transactionId, 
      status, 
      bankTransactionId, 
      amount, 
      transactionTime,
      description,
      accountNumber,
      bankCode = 'MB',
      reference,
      customerName,
      customerAccount
    } = webhookData;

    console.log(`🔍 Processing webhook for transaction: ${transactionId}, status: ${status}`);

    // ============ FIND PAYMENT ============
    const payment = await Payment.findOne({ transactionId })
      .populate('userId', 'name email phone')
      .populate({
        path: 'enrollmentId',
        populate: {
          path: 'courseId',
          select: 'title description instructor thumbnail price duration accessUrl status'
        }
      });

    if (!payment) {
      console.warn(`⚠️ Payment not found for transaction: ${transactionId}`);
      
      // Log unknown transaction for investigation
      await logUnknownWebhookTransaction(webhookData, webhookId);
      
      return res.status(404).json({ 
        success: false, 
        message: 'Payment not found',
        webhookId
      });
    }

    // ============ VALIDATE PAYMENT DETAILS ============
    const validationErrors = [];
    
    // Validate amount
    if (amount && parseFloat(amount) !== payment.amount) {
      validationErrors.push(`Amount mismatch: webhook ${amount}, db ${payment.amount}`);
    }
    
    // Validate account number (if provided)
    const expectedAccount = process.env.MB_ACCOUNT_NUMBER || '0987654321';
    if (accountNumber && accountNumber !== expectedAccount) {
      validationErrors.push(`Account mismatch: webhook ${accountNumber}, expected ${expectedAccount}`);
    }
    
    if (validationErrors.length > 0) {
      console.warn(`⚠️ Validation errors for ${transactionId}:`, validationErrors);
      
      // Send alert for suspicious transaction
      await sendWebhookFailureEmail({
        to: process.env.ADMIN_EMAIL || 'admin@webhoc.edu.vn',
        transactionId,
        paymentId: payment._id,
        userId: payment.userId._id,
        errors: validationErrors,
        webhookData,
        webhookId
      });
    }

    // ============ CHECK PAYMENT STATUS ============
    // Only process if payment is still pending
    if (payment.status !== 'pending') {
      console.log(`ℹ️ Payment ${transactionId} already in status: ${payment.status}`);
      return res.status(200).json({ 
        success: true, 
        message: `Payment already ${payment.status}`,
        webhookId,
        currentStatus: payment.status
      });
    }

    // Check if payment is expired
    if (payment.expiresAt < new Date()) {
      payment.status = 'expired';
      payment.gatewayResponse = {
        ...payment.gatewayResponse,
        webhookReceived: true,
        webhookId,
        webhookData: webhookData,
        expiredAt: new Date(),
        expiredReason: 'Webhook received after expiry'
      };
      await payment.save();
      
      console.log(`⏰ Payment ${transactionId} expired before webhook`);
      return res.status(200).json({ 
        success: true, 
        message: 'Payment expired before webhook',
        webhookId
      });
    }

    // ============ PROCESS WEBHOOK STATUS ============
    let processingResult;
    
    switch (status.toUpperCase()) {
      case 'SUCCESS':
      case 'COMPLETED':
      case 'PAID':
        processingResult = await processSuccessfulPayment(
          payment, 
          webhookData, 
          webhookId,
          bankTransactionId,
          reference,
          transactionTime
        );
        break;
        
      case 'FAILED':
      case 'CANCELLED':
      case 'REJECTED':
        processingResult = await processFailedPayment(
          payment, 
          webhookData, 
          webhookId
        );
        break;
        
      case 'PENDING':
      case 'PROCESSING':
        processingResult = await processPendingPayment(
          payment, 
          webhookData, 
          webhookId
        );
        break;
        
      default:
        console.warn(`⚠️ Unknown webhook status: ${status} for ${transactionId}`);
        processingResult = {
          success: false,
          message: `Unknown status: ${status}`
        };
    }

    // ============ SEND WEBHOOK RESPONSE ============
    console.log(`📤 Webhook ${webhookId} response:`, processingResult);
    
    res.status(200).json({
      success: true,
      message: 'Webhook processed successfully',
      webhookId,
      transactionId,
      paymentId: payment._id,
      paymentStatus: payment.status,
      ...processingResult
    });

  } catch (error) {
    console.error(`❌ Webhook ${webhookId} error:`, error);
    
    // Send error notification to admin
    try {
      await sendWebhookFailureEmail({
        to: process.env.ADMIN_EMAIL || 'admin@webhoc.edu.vn',
        webhookId,
        error: error.message,
        stack: error.stack,
        body: req.body,
        timestamp: new Date().toISOString()
      });
    } catch (emailError) {
      console.error('Failed to send webhook error email:', emailError);
    }

    res.status(500).json({ 
      success: false, 
      message: 'Internal server error processing webhook',
      webhookId,
      error: process.env.NODE_ENV === 'production' ? undefined : error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Verify webhook signature
 */
function verifyWebhookSignature(req) {
  // Get signature from header
  const signature = req.headers['x-vietqr-signature'] || 
                   req.headers['x-webhook-signature'] ||
                   req.headers['x-bank-signature'];
  
  const timestamp = req.headers['x-webhook-timestamp'];
  
  // For development/testing, you can bypass signature check
  if (process.env.NODE_ENV === 'development' && process.env.SKIP_WEBHOOK_SIGNATURE === 'true') {
    console.log('⚠️ Skipping webhook signature verification in development');
    return true;
  }
  
  // Check if signature exists
  if (!signature) {
    console.warn('Missing webhook signature');
    return false;
  }
  
  // Get webhook secret from environment
  const secret = process.env.VIETQR_WEBHOOK_SECRET || 
                process.env.WEBHOOK_SECRET;
  
  if (!secret) {
    console.error('Webhook secret not configured');
    return false;
  }
  
  // Create expected signature
  const payload = timestamp ? `${timestamp}.${JSON.stringify(req.body)}` : JSON.stringify(req.body);
  
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  // Compare signatures (use constant-time comparison in production)
  const isValid = signature === expectedSignature;
  
  if (!isValid) {
    console.warn('Invalid webhook signature:', {
      received: signature,
      expected: expectedSignature,
      timestamp,
      payloadLength: payload.length
    });
  }
  
  return isValid;
}

/**
 * Validate webhook data structure
 */
function validateWebhookData(data) {
  if (!data) {
    return { valid: false, error: 'Empty webhook data' };
  }
  
  if (!data.transactionId) {
    return { valid: false, error: 'Missing transactionId' };
  }
  
  if (!data.status) {
    return { valid: false, error: 'Missing status' };
  }
  
  if (!data.amount) {
    return { valid: false, error: 'Missing amount' };
  }
  
  // Validate status values
  const validStatuses = ['SUCCESS', 'COMPLETED', 'PAID', 'FAILED', 'CANCELLED', 'REJECTED', 'PENDING', 'PROCESSING'];
  if (!validStatuses.includes(data.status.toUpperCase())) {
    return { valid: false, error: `Invalid status: ${data.status}` };
  }
  
  return { valid: true };
}

/**
 * Process successful payment webhook
 */
async function processSuccessfulPayment(payment, webhookData, webhookId, bankTransactionId, reference, transactionTime) {
  try {
    const now = new Date();
    
    // Update payment
    payment.status = 'completed';
    payment.completedAt = new Date(transactionTime || now);
    payment.gatewayResponse = {
      ...payment.gatewayResponse,
      bankTransactionId,
      bankReference: reference,
      webhookReceived: true,
      webhookId,
      webhookData: webhookData,
      verifiedAt: now,
      verifiedBy: 'vietqr_webhook',
      bankCode: webhookData.bankCode,
      accountNumber: webhookData.accountNumber,
      customerName: webhookData.customerName,
      customerAccount: webhookData.customerAccount
    };
    await payment.save();

    // Process enrollment if exists
    let enrollmentUpdated = false;
    if (payment.enrollmentId) {
      enrollmentUpdated = await processEnrollmentAfterPayment(payment);
    }

    // Send notifications
    await sendPaymentNotifications(payment, {
      bankTransactionId,
      reference,
      bankName: getBankName(webhookData.bankCode),
      transactionTime: payment.completedAt
    }, enrollmentUpdated);

    console.log(`✅ Payment ${payment.transactionId} completed via webhook`);
    
    return {
      processed: true,
      action: 'payment_completed',
      enrollmentUpdated,
      timestamp: now.toISOString()
    };
    
  } catch (error) {
    console.error('Error processing successful payment:', error);
    throw error;
  }
}

/**
 * Process failed payment webhook
 */
async function processFailedPayment(payment, webhookData, webhookId) {
  try {
    payment.status = 'failed';
    payment.gatewayResponse = {
      ...payment.gatewayResponse,
      webhookReceived: true,
      webhookId,
      webhookData: webhookData,
      failedAt: new Date(),
      failureReason: webhookData.reason || webhookData.message || 'Payment failed via webhook',
      failureCode: webhookData.errorCode
    };
    await payment.save();

    // Update enrollment if exists
    if (payment.enrollmentId) {
      await Enrollment.findByIdAndUpdate(payment.enrollmentId._id, {
        paymentStatus: 'failed',
        enrollmentStatus: 'payment_failed'
      });
    }

    console.log(`❌ Payment ${payment.transactionId} failed via webhook`);
    
    return {
      processed: true,
      action: 'payment_failed',
      reason: webhookData.reason,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('Error processing failed payment:', error);
    throw error;
  }
}

/**
 * Process pending payment webhook
 */
async function processPendingPayment(payment, webhookData, webhookId) {
  try {
    payment.gatewayResponse = {
      ...payment.gatewayResponse,
      webhookReceived: true,
      webhookId,
      webhookData: webhookData,
      lastWebhookCheck: new Date(),
      webhookStatus: 'pending'
    };
    await payment.save();

    console.log(`⏳ Payment ${payment.transactionId} still pending via webhook`);
    
    return {
      processed: true,
      action: 'payment_pending',
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('Error processing pending payment:', error);
    throw error;
  }
}

/**
 * Log unknown webhook transaction for investigation
 */
async function logUnknownWebhookTransaction(webhookData, webhookId) {
  // In production, you might want to save this to a separate collection
  // or send an alert to the admin team
  
  console.error('🚨 Unknown webhook transaction received:', {
    webhookId,
    transactionId: webhookData.transactionId,
    amount: webhookData.amount,
    status: webhookData.status,
    timestamp: new Date().toISOString(),
    data: webhookData
  });
}

// @desc    Get QR payment history (đơn giản hóa)
// @route   GET /v2/payments/qr/history
// @access  Private
const getQRPaymentHistory = async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 10 
    } = req.query;
    
    const userId = req.user.id;

    // Build query - chỉ lấy payment của user hiện tại
    let query = {
      userId: userId,
      paymentMethod: { $regex: /vietqr|bank_transfer|qr/, $options: 'i' }
    };

    // Execute query with pagination
    const payments = await Payment.find(query)
      .populate({
        path: 'enrollmentId',
        populate: {
          path: 'courseId',
          select: 'title slug coverImageUrl'
        }
      })
      .sort({ createdAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .lean();

    const total = await Payment.countDocuments(query);

    // Format response data đơn giản
    const formattedPayments = payments.map(payment => {
      const enrollment = payment.enrollmentId;
      const course = enrollment?.courseId;
      
      return {
        id: payment._id,
        transactionId: payment.transactionId,
        amount: {
          vnd: payment.amountCents / 100,
          formatted: (payment.amountCents / 100).toLocaleString('vi-VN') + ' VND'
        },
        status: payment.status,
        bank: 'MB Bank',
        course: course ? {
          id: course._id,
          title: course.title,
          slug: course.slug,
          coverImage: course.coverImageUrl
        } : null,
        createdAt: payment.createdAt,
        completedAt: payment.completedAt,
        invoiceNumber: payment.invoiceNumber
      };
    });

    res.json({
      statusCode: 200,
      data: {
        payments: formattedPayments,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get payment statistics đơn giản
// @route   GET /v2/payments/qr/stats
// @access  Private (Admin)
const getPaymentStats = async (req, res, next) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({
        statusCode: 403,
        message: 'Chỉ admin mới có quyền xem thống kê'
      });
    }

    const now = new Date();
    const startDate = new Date();
    startDate.setDate(now.getDate() - 30); // 30 ngày gần nhất

    // Build base query
    const baseQuery = {
      createdAt: { $gte: startDate },
      paymentMethod: { $regex: /vietqr|bank_transfer|qr/, $options: 'i' }
    };

    // 1. Tổng quan
    const overallStats = await Payment.aggregate([
      { $match: baseQuery },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$amountCents' },
          totalTransactions: { $sum: 1 },
          completedTransactions: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          }
        }
      }
    ]);

    const stats = overallStats[0] || {
      totalRevenue: 0,
      totalTransactions: 0,
      completedTransactions: 0
    };

    // 2. Thống kê theo ngày (7 ngày gần nhất)
    const dailyStats = await Payment.aggregate([
      {
        $match: {
          ...baseQuery,
          createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          date: { $first: '$createdAt' },
          totalAmount: { $sum: '$amountCents' },
          count: { $sum: 1 }
        }
      },
      { 
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } 
      }
    ]);

    // 3. Giao dịch gần đây
    const recentTransactions = await Payment.find(baseQuery)
      .populate('userId', 'displayName email')
      .populate({
        path: 'enrollmentId',
        populate: { path: 'courseId', select: 'title' }
      })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    res.json({
      statusCode: 200,
      data: {
        overall: {
          totalRevenue: stats.totalRevenue / 100,
          totalRevenueFormatted: (stats.totalRevenue / 100).toLocaleString('vi-VN') + ' VND',
          totalTransactions: stats.totalTransactions,
          completedTransactions: stats.completedTransactions,
          conversionRate: stats.totalTransactions > 0 
            ? ((stats.completedTransactions / stats.totalTransactions) * 100).toFixed(1)
            : 0,
          avgTransaction: stats.completedTransactions > 0
            ? Math.round((stats.totalRevenue / 100) / stats.completedTransactions)
            : 0
        },
        chart: {
          daily: dailyStats.map(stat => ({
            date: new Date(stat.date).toISOString().split('T')[0],
            label: new Date(stat.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
            amount: stat.totalAmount / 100,
            count: stat.count
          }))
        },
        recent: recentTransactions.map(tx => ({
          id: tx._id,
          transactionId: tx.transactionId,
          amount: tx.amountCents / 100,
          status: tx.status,
          user: tx.userId ? {
            name: tx.userId.displayName,
            email: tx.userId.email
          } : null,
          course: tx.enrollmentId?.courseId?.title,
          createdAt: tx.createdAt
        }))
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get supported banks - Chỉ MB Bank
// @route   GET /v2/payments/qr/banks
// @access  Public
const getSupportedBanks = async (req, res) => {
  const banks = [
    {
      code: 'MB',
      name: 'Ngân hàng Quân đội',
      shortName: 'MB',
      logo: 'https://cdn.haitrieu.com/ws/logo/mb.png',
      qrSupported: true,
      template: 'compact',
      accountNumber: process.env.VIETQR_ACCOUNT_NUMBER || '0819572109',
      accountName: process.env.VIETQR_ACCOUNT_NAME || 'WEBHOC LEARNING',
      description: 'Ngân hàng chính thức của hệ thống',
      active: true,
      transferLimit: 'Không giới hạn',
      processingTime: '3-5 phút',
      bankCode: 'MB',
      swiftCode: 'MSCBVNVX',
      branch: 'Chi nhánh Đà Nẵng',
      color: '#D70026',
      supportPhone: '1900545454',
      supportEmail: 'support@mbbank.com.vn',
      website: 'https://www.mbbank.com.vn',
      note: 'Vui lòng thêm nội dung chuyển khoản theo đúng hướng dẫn để hệ thống tự động xác nhận.'
    }
  ];

  res.json({
    statusCode: 200,
    data: {
      banks: banks,
      primaryBank: banks[0],
      total: 1,
      note: 'Hệ thống hiện chỉ hỗ trợ thanh toán qua MB Bank. Quý khách vui lòng sử dụng ứng dụng MB Bank để quét mã QR hoặc chuyển khoản thủ công.',
      instructions: [
        '1. Mở ứng dụng MB Bank trên điện thoại',
        '2. Chọn tính năng "Quét mã QR"',
        '3. Quét mã QR hiển thị trên màn hình',
        '4. Kiểm tra thông tin thanh toán',
        '5. Xác nhận thanh toán',
        '6. Hệ thống sẽ tự động kích hoạt khóa học trong 3-5 phút'
      ]
    }
  });
};

// @desc    Manual payment confirmation (admin only) - Đơn giản hóa
// @route   POST /v2/payments/qr/manual-confirm
// @access  Private (Admin)
const manualConfirmPayment = async (req, res, next) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({
        statusCode: 403,
        message: 'Chỉ admin mới có quyền xác nhận thanh toán thủ công'
      });
    }

    const { paymentId, note } = req.body;

    if (!paymentId) {
      return res.status(400).json({
        statusCode: 400,
        message: 'paymentId là bắt buộc'
      });
    }

    // Find payment
    const payment = await Payment.findById(paymentId)
      .populate('userId')
      .populate({
        path: 'enrollmentId',
        populate: { path: 'courseId' }
      });

    if (!payment) {
      return res.status(404).json({
        statusCode: 404,
        message: 'Không tìm thấy thanh toán'
      });
    }

    // Check if payment is already completed
    if (payment.status === 'completed') {
      return res.status(400).json({
        statusCode: 400,
        message: 'Thanh toán này đã được xác nhận trước đó'
      });
    }

    // Update payment
    payment.status = 'completed';
    payment.completedAt = new Date();
    payment.gatewayResponse = {
      ...payment.gatewayResponse,
      bankTransactionId: `MANUAL-${Date.now()}`,
      confirmedBy: req.user.id,
      confirmedAt: new Date(),
      note: note || 'Xác nhận thủ công bởi admin',
      method: 'manual_confirmation'
    };

    // Update enrollment
    let enrollment = payment.enrollmentId;
    if (!enrollment) {
      enrollment = await Enrollment.create({
        userId: payment.userId._id,
        courseId: req.body.courseId || payment.gatewayResponse?.courseId,
        paymentStatus: 'paid',
        paymentId: payment._id,
        enrolledAt: new Date()
      });
      payment.enrollmentId = enrollment._id;
    } else {
      enrollment.paymentStatus = 'paid';
      await enrollment.save();
    }

    await payment.save();

    // Generate invoice
    try {
      const user = payment.userId;
      const course = enrollment.courseId;
      if (user && course) {
        await handlePostPaymentInvoice(payment, enrollment, user, course);
      }
    } catch (invoiceErr) {
      console.error('Invoice generation failed:', invoiceErr);
    }

    res.json({
      statusCode: 200,
      data: {
        payment: {
          id: payment._id,
          transactionId: payment.transactionId,
          amount: payment.amountCents / 100,
          status: payment.status,
          confirmedAt: payment.completedAt
        },
        enrollment: {
          id: enrollment._id,
          courseId: enrollment.courseId,
          userId: enrollment.userId
        },
        user: {
          id: payment.userId._id,
          name: payment.userId.displayName,
          email: payment.userId.email
        }
      },
      message: 'Đã xác nhận thanh toán thủ công thành công'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get payment details - Đơn giản hóa
// @route   GET /v2/payments/qr/:paymentId
// @access  Private
const getPaymentDetails = async (req, res, next) => {
  try {
    const { paymentId } = req.params;
    const userId = req.user.id;

    const payment = await Payment.findById(paymentId)
      .populate({
        path: 'enrollmentId',
        populate: {
          path: 'courseId',
          select: 'title priceCents coverImageUrl slug instructor'
        }
      });

    if (!payment) {
      return res.status(404).json({
        statusCode: 404,
        message: 'Thanh toán không tồn tại'
      });
    }

    // Verify ownership
    if (payment.userId.toString() !== userId && !req.user.isAdmin) {
      return res.status(403).json({
        statusCode: 403,
        message: 'Bạn không có quyền xem thanh toán này'
      });
    }

    const course = payment.enrollmentId?.courseId;

    res.json({
      statusCode: 200,
      data: {
        payment: {
          id: payment._id,
          transactionId: payment.transactionId,
          amount: payment.amountCents / 100,
          currency: payment.currency,
          status: payment.status,
          paymentMethod: payment.paymentMethod,
          bank: {
            name: payment.bankName,
            accountNumber: payment.bankAccountNumber,
            accountName: payment.bankAccountName,
            code: payment.bankCode
          },
          invoiceNumber: payment.invoiceNumber,
          createdAt: payment.createdAt,
          expiresAt: payment.expiresAt,
          completedAt: payment.completedAt
        },
        course: course ? {
          id: course._id,
          title: course.title,
          price: course.priceCents / 100,
          coverImage: course.coverImageUrl,
          slug: course.slug,
          instructor: course.instructor
        } : null,
        enrollment: payment.enrollmentId ? {
          id: payment.enrollmentId._id,
          status: payment.enrollmentId.paymentStatus,
          enrolledAt: payment.enrollmentId.enrolledAt
        } : null,
        instructions: {
          manualTransfer: [
            'Chuyển khoản thủ công:',
            `- Ngân hàng: ${payment.bankName}`,
            `- Số tài khoản: ${payment.bankAccountNumber}`,
            `- Chủ tài khoản: ${payment.bankAccountName}`,
            `- Số tiền: ${(payment.amountCents / 100).toLocaleString('vi-VN')} VND`,
            `- Nội dung: ${course?.title || 'Thanh toán khóa học'}`,
            '- Sau khi chuyển khoản, hệ thống sẽ tự động xác nhận trong 3-5 phút'
          ]
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get course info for payment - Đơn giản hóa
// @route   GET /v2/payments/course/:courseId/info
// @access  Public
const getCoursePaymentInfo = async (req, res, next) => {
  try {
    const { courseId } = req.params;

    const course = await Course.findById(courseId)
      .select('title priceCents description coverImageUrl slug duration instructor category level');
    
    if (!course) {
      return res.status(404).json({
        statusCode: 404,
        message: 'Khóa học không tồn tại'
      });
    }

    // Lấy thông tin ngân hàng MB
    const banks = [
      {
        code: 'MB',
        name: 'Ngân hàng Quân đội',
        shortName: 'MB',
        logo: 'https://cdn.haitrieu.com/ws/logo/mb.png',
        qrSupported: true,
        accountNumber: process.env.VIETQR_ACCOUNT_NUMBER || '0819572109',
        accountName: process.env.VIETQR_ACCOUNT_NAME || 'WEBHOC LEARNING'
      }
    ];

    res.json({
      statusCode: 200,
      data: {
        course: {
          id: course._id,
          title: course.title,
          price: course.priceCents / 100,
          priceCents: course.priceCents,
          description: course.description,
          coverImage: course.coverImageUrl,
          slug: course.slug,
          duration: course.duration,
          instructor: course.instructor,
          category: course.category,
          level: course.level
        },
        paymentMethods: [
          {
            type: 'qr',
            name: 'Chuyển khoản QR Code',
            description: 'Quét mã QR bằng ứng dụng MB Bank để thanh toán nhanh chóng',
            banks: ['MB'],
            processingTime: 'Tự động xác nhận trong 3-5 phút',
            icon: 'qr',
            recommended: true
          }
        ],
        instructions: {
          qr: [
            'Mở ứng dụng MB Bank trên điện thoại',
            'Chọn "Quét mã QR" hoặc "Scan QR"',
            'Quét mã QR hiển thị trên màn hình',
            `Chuyển đúng ${(course.priceCents / 100).toLocaleString('vi-VN')} VND`,
            `Nội dung chuyển khoản: "${course.title}"`,
            'Xác nhận thanh toán',
            'Hệ thống tự động kích hoạt khóa học'
          ],
          important: [
            'Chỉ sử dụng ứng dụng MB Bank để quét mã QR',
            'Phải chuyển đúng số tiền như hiển thị',
            'Nội dung chuyển khoản phải đúng tên khóa học',
            'Lưu mã giao dịch để tra cứu khi cần'
          ]
        },
        bank: banks[0]
      }
    });
  } catch (error) {
    next(error);
  }
};



module.exports = {
  generateVietQR,
  quickEnrollWithQR,
  verifyQRPayment,
  handleVietQRWebhook,
  getPaymentDetails,
  getCoursePaymentInfo,
  getQRPaymentHistory,
  getPaymentStats,
  getSupportedBanks,
  manualConfirmPayment
};