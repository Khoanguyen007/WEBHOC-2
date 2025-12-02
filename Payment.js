const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  enrollmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Enrollment',
    default: null
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amountCents: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'USD',
    uppercase: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded', 'expired'],
    required: true
  },
  transactionId: {
    type: String,
    required: true,
    unique: true
  },
  paymentMethod: {
    type: String,
    default: null
  },
  invoiceNumber: {
    type: String,
    default: null
  },
  gatewayResponse: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  // Bank transfer fields
  bankCode: {
    type: String,
    default: null
  },
  bankAccountNumber: {
    type: String,
    default: null
  },
  bankAccountName: {
    type: String,
    default: null
  },
  bankName: {
    type: String,
    default: null
  },
  expiresAt: {
    type: Date,
    default: null
  },
  completedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Indexes
paymentSchema.index({ enrollmentId: 1 });
paymentSchema.index({ userId: 1 });
paymentSchema.index({ transactionId: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ createdAt: -1 });

// Virtual for amount in dollars
paymentSchema.virtual('amount').get(function() {
  return (this.amountCents / 100).toFixed(2);
});

paymentSchema.set('toJSON', {
  virtuals: true
});

module.exports = mongoose.model('Payment', paymentSchema);