const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  enrollmentDate: {
    type: Date,
    default: Date.now
  },
  completionPercentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  lastAccessedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound unique index - one enrollment per user per course
enrollmentSchema.index({ userId: 1, courseId: 1 }, { unique: true });

// Indexes for common queries
enrollmentSchema.index({ userId: 1, enrollmentDate: -1 });
enrollmentSchema.index({ courseId: 1 });
enrollmentSchema.index({ paymentStatus: 1 });

module.exports = mongoose.model('Enrollment', enrollmentSchema);