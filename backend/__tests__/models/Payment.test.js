const mongoose = require('mongoose');
const Payment = require('../../models/Payment');
const User = require('../../models/User');
const Course = require('../../models/Course');
const Enrollment = require('../../models/Enrollment');

describe('Payment Model & Integration', () => {
  let user, course, enrollment;

  beforeEach(async () => {
    await Payment.deleteMany({});
    await User.deleteMany({});
    await Course.deleteMany({});
    await Enrollment.deleteMany({});

    // Create test data
    user = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: 'hashedpassword123',
      role: 'user',
      emailVerified: true
    });

    course = await Course.create({
      title: 'Test Course',
      description: 'Test description',
      category: 'Programming',
      difficulty: 'Beginner',
      instructor: new mongoose.Types.ObjectId(),
      priceCents: 9999,
      thumbnail: 'https://example.com/thumb.jpg'
    });

    enrollment = await Enrollment.create({
      user: user._id,
      course: course._id,
      enrollmentDate: new Date(),
      completionPercentage: 0
    });
  });

  describe('Payment Creation', () => {
    it('should create a Stripe payment record', async () => {
      const paymentData = {
        user: user._id,
        course: course._id,
        enrollment: enrollment._id,
        amount: 9999,
        currency: 'USD',
        method: 'stripe',
        stripePaymentIntentId: 'pi_1234567890',
        status: 'completed'
      };

      const payment = await Payment.create(paymentData);
      expect(payment).toBeDefined();
      expect(payment.method).toBe('stripe');
      expect(payment.status).toBe('completed');
      expect(payment.user.toString()).toBe(user._id.toString());
    });

    it('should create a PayPal payment record', async () => {
      const paymentData = {
        user: user._id,
        course: course._id,
        enrollment: enrollment._id,
        amount: 9999,
        currency: 'USD',
        method: 'paypal',
        paypalTransactionId: 'PAY-1234567890',
        status: 'completed'
      };

      const payment = await Payment.create(paymentData);
      expect(payment.method).toBe('paypal');
      expect(payment.paypalTransactionId).toBe('PAY-1234567890');
    });

    it('should track invoice number when generated', async () => {
      const paymentData = {
        user: user._id,
        course: course._id,
        enrollment: enrollment._id,
        amount: 9999,
        currency: 'USD',
        method: 'stripe',
        stripePaymentIntentId: 'pi_1234567890',
        status: 'completed',
        invoiceNumber: 'WH-2025-ABC123'
      };

      const payment = await Payment.create(paymentData);
      expect(payment.invoiceNumber).toBe('WH-2025-ABC123');
    });

    it('should set default status to pending', async () => {
      const paymentData = {
        user: user._id,
        course: course._id,
        enrollment: enrollment._id,
        amount: 9999,
        currency: 'USD',
        method: 'stripe',
        stripePaymentIntentId: 'pi_1234567890'
      };

      const payment = await Payment.create(paymentData);
      expect(payment.status).toBe('pending');
    });
  });

  describe('Payment Tracking', () => {
    it('should track payment attempt timestamp', async () => {
      const beforeTime = new Date();
      const payment = await Payment.create({
        user: user._id,
        course: course._id,
        enrollment: enrollment._id,
        amount: 9999,
        currency: 'USD',
        method: 'stripe',
        stripePaymentIntentId: 'pi_1234567890',
        status: 'pending'
      });
      const afterTime = new Date();

      expect(payment.createdAt).toBeInstanceOf(Date);
      expect(payment.createdAt.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
      expect(payment.createdAt.getTime()).toBeLessThanOrEqual(afterTime.getTime());
    });

    it('should track payment updates', async () => {
      const payment = await Payment.create({
        user: user._id,
        course: course._id,
        enrollment: enrollment._id,
        amount: 9999,
        currency: 'USD',
        method: 'stripe',
        stripePaymentIntentId: 'pi_1234567890',
        status: 'pending'
      });

      const originalUpdatedAt = payment.updatedAt;

      // Simulate a small delay
      await new Promise(resolve => setTimeout(resolve, 10));

      await Payment.updateOne(
        { _id: payment._id },
        { status: 'completed' }
      );

      const updatedPayment = await Payment.findById(payment._id);
      expect(updatedPayment.status).toBe('completed');
      expect(updatedPayment.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });

  describe('Payment Queries', () => {
    beforeEach(async () => {
      await Payment.create([
        {
          user: user._id,
          course: course._id,
          enrollment: enrollment._id,
          amount: 9999,
          currency: 'USD',
          method: 'stripe',
          stripePaymentIntentId: 'pi_111',
          status: 'completed'
        },
        {
          user: user._id,
          course: course._id,
          enrollment: enrollment._id,
          amount: 4999,
          currency: 'USD',
          method: 'paypal',
          paypalTransactionId: 'PAY-222',
          status: 'failed'
        }
      ]);
    });

    it('should find payments by user', async () => {
      const payments = await Payment.find({ user: user._id });
      expect(payments.length).toBe(2);
    });

    it('should find completed payments only', async () => {
      const payments = await Payment.find({ 
        user: user._id,
        status: 'completed'
      });
      expect(payments.length).toBe(1);
      expect(payments[0].status).toBe('completed');
    });

    it('should find payments by method', async () => {
      const stripePayments = await Payment.find({ method: 'stripe' });
      expect(stripePayments.length).toBeGreaterThan(0);
      stripePayments.forEach(payment => {
        expect(payment.method).toBe('stripe');
      });
    });

    it('should calculate total revenue', async () => {
      const payments = await Payment.find({ 
        user: user._id,
        status: 'completed'
      });
      
      const totalRevenue = payments.reduce((sum, payment) => sum + payment.amount, 0);
      expect(totalRevenue).toBe(9999);
    });
  });

  describe('Invoice Generation Field', () => {
    it('should allow null invoiceNumber for newly created payments', async () => {
      const payment = await Payment.create({
        user: user._id,
        course: course._id,
        enrollment: enrollment._id,
        amount: 9999,
        currency: 'USD',
        method: 'stripe',
        stripePaymentIntentId: 'pi_1234567890',
        status: 'pending'
      });

      expect(payment.invoiceNumber).toBeNull();
    });

    it('should update invoiceNumber after invoice generation', async () => {
      const payment = await Payment.create({
        user: user._id,
        course: course._id,
        enrollment: enrollment._id,
        amount: 9999,
        currency: 'USD',
        method: 'stripe',
        stripePaymentIntentId: 'pi_1234567890',
        status: 'completed'
      });

      await Payment.updateOne(
        { _id: payment._id },
        { invoiceNumber: 'WH-2025-XYZ789' }
      );

      const updatedPayment = await Payment.findById(payment._id);
      expect(updatedPayment.invoiceNumber).toBe('WH-2025-XYZ789');
    });
  });
});
