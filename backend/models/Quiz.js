const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
    trim: true
  },
  options: [{
    type: String,
    required: true
  }],
  correctAnswer: {
    type: Number, // index of correct option (0, 1, 2, 3)
    required: true,
    min: 0,
    max: 3
  },
  explanation: {
    type: String,
    default: ''
  },
  points: {
    type: Number,
    default: 1
  }
});

const quizSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Quiz title is required'],
    trim: true,
    minlength: [3, 'Quiz title must be at least 3 characters']
  },
  description: {
    type: String,
    default: ''
  },
  questions: [questionSchema],
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  lessonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lesson',
    default: null
  },
  passingScore: {
    type: Number,
    default: 70, // percentage
    min: 0,
    max: 100
  },
  timeLimit: {
    type: Number, // in minutes
    default: 30
  },
  maxAttempts: {
    type: Number,
    default: 3
  },
  isPublished: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

quizSchema.pre('save', function(next) {
  console.log('Saving quiz to database:', this.title);
  next();
});

module.exports = mongoose.model('Quiz', quizSchema);