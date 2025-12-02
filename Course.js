const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Course title is required'],
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: [true, 'Course description is required'],
    maxlength: 2000
  },
  coverImageUrl: {
    type: String,
    required: [true, 'Cover image is required']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true
  },
  difficultyLevel: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    required: true
  },
  priceCents: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  instructorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Indexes
courseSchema.index({ instructorId: 1 });
courseSchema.index({ category: 1 });
courseSchema.index({ difficultyLevel: 1 });
courseSchema.index({ priceCents: 1 });
courseSchema.index({ createdAt: -1 });

// Text index for full-text search
courseSchema.index({ 
  title: 'text', 
  description: 'text', 
  category: 'text'
}, { 
  weights: { 
    title: 10,      // Title matches worth more
    description: 5, // Description matches worth less
    category: 3     // Category matches worth least
  }
});

// Virtual for price in dollars
courseSchema.virtual('price').get(function() {
  return (this.priceCents / 100).toFixed(2);
});

courseSchema.set('toJSON', {
  virtuals: true
});

module.exports = mongoose.model('Course', courseSchema);