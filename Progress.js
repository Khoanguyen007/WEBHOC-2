const mongoose = require('mongoose');

const progressSchema = new mongoose.Schema({
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
  lessonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lesson',
    required: true
  },
  completed: {
    type: Boolean,
    default: false
  },
  timeSpent: {
    type: Number, // in seconds
    default: 0
  },
  lastPosition: {
    type: Number, // video position in seconds
    default: 0
  }
}, {
  timestamps: true
});

// Compound index
progressSchema.index({ userId: 1, courseId: 1, lessonId: 1 }, { unique: true });

module.exports = mongoose.model('Progress', progressSchema);