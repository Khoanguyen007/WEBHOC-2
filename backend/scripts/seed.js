const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env from backend/.env
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const User = require('../models/User');
const Course = require('../models/Course');
const Lesson = require('../models/Lesson');
const Enrollment = require('../models/Enrollment');
const Payment = require('../models/Payment');
const Progress = require('../models/Progress');
const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('MONGODB_URI not set in .env');
  process.exit(1);
}

const SEED_FORCE = process.env.SEED_FORCE === 'true';

async function hasDocuments(model) {
  const c = await model.estimatedDocumentCount();
  return c > 0;
}

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Users
    if (!SEED_FORCE && await hasDocuments(User)) {
      console.log('Users collection already has documents — skipping (set SEED_FORCE=true to force)');
    } else {
      await User.deleteMany({});
      const users = await User.create([
        { email: 'alice@example.com', password: 'password123', displayName: 'Alice', role: 'student', isEmailVerified: true },
        { email: 'bob@example.com', password: 'password123', displayName: 'Bob', role: 'instructor', isEmailVerified: true },
        { email: 'admin@example.com', password: 'password123', displayName: 'Admin', role: 'admin', isEmailVerified: true }
      ]);
      console.log(`Inserted ${users.length} users`);
    }

    // Courses
    if (!SEED_FORCE && await hasDocuments(Course)) {
      console.log('Courses collection already has documents — skipping');
    } else {
      await Course.deleteMany({});
      const instructor = await User.findOne({ role: 'instructor' }) || await User.findOne();
      const courses = await Course.create([
        {
          title: 'Intro to JavaScript',
          description: 'Learn JavaScript from scratch',
          coverImageUrl: 'https://placehold.co/600x400',
          category: 'Programming',
          difficultyLevel: 'Beginner',
          priceCents: 0,
          instructorId: instructor._id,
          isPublished: true
        },
        {
          title: 'Advanced Node.js',
          description: 'Deep dive into Node.js internals',
          coverImageUrl: 'https://placehold.co/600x400',
          category: 'Programming',
          difficultyLevel: 'Advanced',
          priceCents: 19900,
          instructorId: instructor._id,
          isPublished: false
        }
      ]);
      console.log(`Inserted ${courses.length} courses`);

      // Lessons for first course
      await Lesson.deleteMany({});
      const lessons = await Lesson.create([
        { title: 'JS Basics', content: 'Variables, types', videoUrl: null, duration: 600, courseId: courses[0]._id, order: 1, isPublished: true },
        { title: 'Functions', content: 'Functions and scope', videoUrl: null, duration: 800, courseId: courses[0]._id, order: 2, isPublished: true }
      ]);
      console.log(`Inserted ${lessons.length} lessons`);
    }

    // Enrollments, Payments, Progress
    if (!SEED_FORCE && await hasDocuments(Enrollment)) {
      console.log('Enrollments already exist — skipping');
    } else {
      await Enrollment.deleteMany({});
      await Payment.deleteMany({});
      await Progress.deleteMany({});

      const student = await User.findOne({ role: 'student' });
      const course = await Course.findOne({ title: 'Intro to JavaScript' });
      const lesson = await Lesson.findOne({ courseId: course._id });

      if (student && course) {
        const enrollment = await Enrollment.create({ userId: student._id, courseId: course._id, paymentStatus: 'paid' });
        console.log('Created enrollment');

        const payment = await Payment.create({
          enrollmentId: enrollment._id,
          userId: student._id,
          amountCents: course.priceCents || 0,
          currency: 'USD',
          status: 'completed',
          transactionId: `tx_${Date.now()}`,
          paymentMethod: 'stripe'
        });
        console.log('Created payment');

        await Progress.create({ userId: student._id, courseId: course._id, lessonId: lesson ? lesson._id : null, completed: false, timeSpent: 0, lastPosition: 0 });
        console.log('Created progress entry');
      } else {
        console.log('Skipping enrollment/payment/progress: missing student or course');
      }
    }

    // Quizzes & Attempts
    if (!SEED_FORCE && await hasDocuments(Quiz)) {
      console.log('Quizzes already exist — skipping');
    } else {
      await Quiz.deleteMany({});
      await QuizAttempt.deleteMany({});

      const course = await Course.findOne({ title: 'Intro to JavaScript' });
      if (course) {
        const quiz = await Quiz.create({
          title: 'JS Basics Quiz',
          description: 'A quick check on basics',
          questions: [
            { question: 'What is typeof 1?', options: ['string','number','object','undefined'], correctAnswer: 1, explanation: '', points: 1 }
          ],
          courseId: course._id,
          passingScore: 50,
          isPublished: true
        });
        console.log('Created quiz');

        const student = await User.findOne({ role: 'student' });
        if (student) {
          await QuizAttempt.create({ userId: student._id, quizId: quiz._id, answers: [{ questionIndex: 0, selectedOption: 1, isCorrect: true }], score: 1, totalQuestions: 1, correctAnswers: 1, percentage: 100, passed: true, timeSpent: 30 });
          console.log('Created quiz attempt');
        }
      }
    }

    console.log('Seeding complete');
  } catch (err) {
    console.error('Seeding error', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

seed();
