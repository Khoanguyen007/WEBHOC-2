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
        { email: 'khoana.24it@vku.udn.vn', password: '21092006', displayName: 'Khoanguyen', role: 'student', isEmailVerified: true },
        { email: 'khoanguyenankhe2004@gmail.com', password: '21092006', displayName: 'UyenThe', role: 'instructor', isEmailVerified: true },
        { email: 'admin@gmail.com', password: '21092006', displayName: 'Admin', role: 'admin', isEmailVerified: true }
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
          description: 'Học JavaScript từ cơ bản. Khóa học này phù hợp cho những người mới bắt đầu lập trình.',
          coverImageUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&h=400&fit=crop',
          category: 'Programming',
          difficultyLevel: 'Beginner',
          priceCents: 0,
          instructorId: instructor._id,
          isPublished: true
        },
        {
          title: 'Advanced Node.js',
          description: 'Khám phá các kỹ thuật nâng cao trong Node.js, tối ưu hóa ứng dụng và quản lý hiệu năng.',
          coverImageUrl: 'https://images.unsplash.com/photo-1633356122544-f134ef2944f1?w=600&h=400&fit=crop',
          category: 'Programming',
          difficultyLevel: 'Advanced',
          priceCents: 29900,
          instructorId: instructor._id,
          isPublished: true
        },
        {
          title: 'React.js Fundamentals',
          description: 'Học React từ đầu, xây dựng ứng dụng single-page với components, state và hooks.',
          coverImageUrl: 'https://images.unsplash.com/photo-1633356122544-f134ef2944f1?w=600&h=400&fit=crop',
          category: 'Programming',
          difficultyLevel: 'Intermediate',
          priceCents: 19900,
          instructorId: instructor._id,
          isPublished: true
        },
        {
          title: 'Python for Data Science',
          description: 'Sử dụng Python để phân tích dữ liệu, pandas, numpy, matplotlib và scikit-learn.',
          coverImageUrl: 'https://images.unsplash.com/photo-1526374965328-7f5ae4e8b312?w=600&h=400&fit=crop',
          category: 'Data Science',
          difficultyLevel: 'Intermediate',
          priceCents: 24900,
          instructorId: instructor._id,
          isPublished: true
        },
        {
          title: 'CSS & Responsive Design',
          description: 'Nắm vững CSS, Flexbox, Grid và thiết kế responsive cho mọi thiết bị.',
          coverImageUrl: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=600&h=400&fit=crop',
          category: 'Web Design',
          difficultyLevel: 'Beginner',
          priceCents: 9900,
          instructorId: instructor._id,
          isPublished: true
        },
        {
          title: 'Database Design with SQL',
          description: 'Thiết kế cơ sở dữ liệu, viết query SQL phức tạp, tối ưu hóa performance.',
          coverImageUrl: 'https://images.unsplash.com/photo-1564721594535-41c865b78688?w=600&h=400&fit=crop',
          category: 'Database',
          difficultyLevel: 'Intermediate',
          priceCents: 19900,
          instructorId: instructor._id,
          isPublished: true
        },
        {
          title: 'Vue.js Complete Guide',
          description: 'Học Vue.js, component patterns, state management với Vuex.',
          coverImageUrl: 'https://images.unsplash.com/photo-1627398242454-45a570e50e1a?w=600&h=400&fit=crop',
          category: 'Programming',
          difficultyLevel: 'Intermediate',
          priceCents: 17900,
          instructorId: instructor._id,
          isPublished: true
        },
        {
          title: 'Docker & Kubernetes',
          description: 'Container technology, deployment, orchestration với Docker và Kubernetes.',
          coverImageUrl: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=600&h=400&fit=crop',
          category: 'DevOps',
          difficultyLevel: 'Advanced',
          priceCents: 34900,
          instructorId: instructor._id,
          isPublished: true
        },
        {
          title: 'Machine Learning Basics',
          description: 'Khái niệm ML, supervised learning, unsupervised learning, neural networks.',
          coverImageUrl: 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?w=600&h=400&fit=crop',
          category: 'Machine Learning',
          difficultyLevel: 'Advanced',
          priceCents: 39900,
          instructorId: instructor._id,
          isPublished: true
        },
        {
          title: 'TypeScript Professional',
          description: 'TypeScript từ cơ bản đến nâng cao, types, generics, decorators.',
          coverImageUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&h=400&fit=crop',
          category: 'Programming',
          difficultyLevel: 'Intermediate',
          priceCents: 21900,
          instructorId: instructor._id,
          isPublished: true
        }
      ]);
      console.log(`Inserted ${courses.length} courses`);

      // Lessons for all courses
      await Lesson.deleteMany({});
      const lessons = await Lesson.create([
        // Course 1: JavaScript Basics
        { title: 'JavaScript Basics', content: 'Giới thiệu về biến, kiểu dữ liệu và các phép toán cơ bản trong JavaScript', videoUrl: 'https://www.youtube.com/embed/orjla7iOSEU', duration: 600, courseId: courses[0]._id, order: 1, isPublished: true },
        { title: 'Functions & Scope', content: 'Tìm hiểu về hàm, hoisting, closure và phạm vi biến', videoUrl: 'https://www.youtube.com/embed/N8ap4k_1QEQ', duration: 800, courseId: courses[0]._id, order: 2, isPublished: true },
        { title: 'Objects & Arrays', content: 'Làm việc với object, array và các phương thức thông dụng', videoUrl: 'https://www.youtube.com/embed/4TYv2AgXUiU', duration: 700, courseId: courses[0]._id, order: 3, isPublished: true },
        
        // Course 2: Advanced Node.js
        { title: 'Node.js Architecture', content: 'Tìm hiểu kiến trúc Event Loop, callback queue và microstack trong Node.js', videoUrl: 'https://www.youtube.com/embed/9qIZZyisLrw', duration: 900, courseId: courses[1]._id, order: 1, isPublished: true },
        { title: 'Express.js Deep Dive', content: 'Xây dựng REST API với middleware, routing, error handling nâng cao', videoUrl: 'https://www.youtube.com/embed/SccSCuHhOw0', duration: 1200, courseId: courses[1]._id, order: 2, isPublished: true },
        { title: 'Async/Await & Promises', content: 'Quản lý bất đồng bộ với Promises, async/await và error handling', videoUrl: 'https://www.youtube.com/embed/V_Kr9OSfdeU', duration: 1000, courseId: courses[1]._id, order: 3, isPublished: true },
        { title: 'Database Integration', content: 'Kết nối MongoDB, Mongoose schema và query optimization', videoUrl: 'https://www.youtube.com/embed/-wGulxCWw9k', duration: 1100, courseId: courses[1]._id, order: 4, isPublished: true },
        
        // Course 3: React.js
        { title: 'React Components', content: 'Học về React components, JSX, props và state', videoUrl: 'https://www.youtube.com/embed/SqcY0GlETPk', duration: 900, courseId: courses[2]._id, order: 1, isPublished: true },
        { title: 'Hooks & State Management', content: 'useState, useEffect, useContext và custom hooks', videoUrl: 'https://www.youtube.com/embed/TNhaISOUy6Q', duration: 1000, courseId: courses[2]._id, order: 2, isPublished: true },
        { title: 'React Router & Navigation', content: 'Routing, navigation, URL parameters trong React', videoUrl: 'https://www.youtube.com/embed/Law7USlSHdE', duration: 800, courseId: courses[2]._id, order: 3, isPublished: true },
        { title: 'Advanced Patterns', content: 'Error boundaries, render props, compound components', videoUrl: 'https://www.youtube.com/embed/43sFW3OW6BA', duration: 950, courseId: courses[2]._id, order: 4, isPublished: true },
        
        // Course 4: Python Data Science
        { title: 'NumPy Basics', content: 'Array operations, indexing, slicing với NumPy', videoUrl: 'https://www.youtube.com/embed/Tdt_LJi-HMc', duration: 850, courseId: courses[3]._id, order: 1, isPublished: true },
        { title: 'Pandas DataFrame', content: 'DataFrames, Series, data manipulation, cleaning', videoUrl: 'https://www.youtube.com/embed/CjuXc5fGZsU', duration: 1100, courseId: courses[3]._id, order: 2, isPublished: true },
        { title: 'Data Visualization', content: 'Matplotlib, Seaborn, tạo biểu đồ chuyên nghiệp', videoUrl: 'https://www.youtube.com/embed/pHQww3nUKN8', duration: 900, courseId: courses[3]._id, order: 3, isPublished: true },
        { title: 'Scikit-learn ML', content: 'Machine learning models, training, evaluation', videoUrl: 'https://www.youtube.com/embed/4RLYCx-kZi0', duration: 1200, courseId: courses[3]._id, order: 4, isPublished: true },
        
        // Course 5: CSS & Responsive
        { title: 'CSS Fundamentals', content: 'Selectors, box model, positioning, colors', videoUrl: 'https://www.youtube.com/embed/OXGznpKZ_sA', duration: 750, courseId: courses[4]._id, order: 1, isPublished: true },
        { title: 'Flexbox Mastery', content: 'Flexbox properties, layouts, alignments', videoUrl: 'https://www.youtube.com/embed/JJSoEo8JSnc', duration: 850, courseId: courses[4]._id, order: 2, isPublished: true },
        { title: 'CSS Grid Layout', content: 'Grid template, gap, alignment, responsive grids', videoUrl: 'https://www.youtube.com/embed/EiNiSFIPIQE', duration: 900, courseId: courses[4]._id, order: 3, isPublished: true },
        { title: 'Responsive Design', content: 'Media queries, mobile-first, responsive images', videoUrl: 'https://www.youtube.com/embed/ZYV6Z1Kk1C0', duration: 800, courseId: courses[4]._id, order: 4, isPublished: true },
        
        // Course 6: SQL Database
        { title: 'SQL Basics', content: 'SELECT, WHERE, ORDER BY, basic queries', videoUrl: 'https://www.youtube.com/embed/bU6IEMX4bIQ', duration: 800, courseId: courses[5]._id, order: 1, isPublished: true },
        { title: 'Joins & Relationships', content: 'INNER JOIN, LEFT JOIN, relationships, foreign keys', videoUrl: 'https://www.youtube.com/embed/WGNgJC1qIlg', duration: 950, courseId: courses[5]._id, order: 2, isPublished: true },
        { title: 'Aggregation & Grouping', content: 'GROUP BY, aggregate functions, HAVING clauses', videoUrl: 'https://www.youtube.com/embed/B3IrABU9-pM', duration: 850, courseId: courses[5]._id, order: 3, isPublished: true },
        { title: 'Optimization & Performance', content: 'Indexes, query planning, performance tuning', videoUrl: 'https://www.youtube.com/embed/h7Jf5j9XAUI', duration: 1000, courseId: courses[5]._id, order: 4, isPublished: true },
        
        // Course 7: Vue.js
        { title: 'Vue Fundamentals', content: 'Directives, data binding, templates', videoUrl: 'https://www.youtube.com/embed/zLHruIzZ5xI', duration: 900, courseId: courses[6]._id, order: 1, isPublished: true },
        { title: 'Components & Props', content: 'Single file components, props, emit events', videoUrl: 'https://www.youtube.com/embed/EKfBJY8Bx-I', duration: 1000, courseId: courses[6]._id, order: 2, isPublished: true },
        { title: 'Vue Router', content: 'Routing, nested routes, lazy loading', videoUrl: 'https://www.youtube.com/embed/KLagHDHqE_s', duration: 850, courseId: courses[6]._id, order: 3, isPublished: true },
        { title: 'Vuex State Management', content: 'State, mutations, actions, getters', videoUrl: 'https://www.youtube.com/embed/nLR-wYcn_FU', duration: 1100, courseId: courses[6]._id, order: 4, isPublished: true },
        
        // Course 8: Docker & Kubernetes
        { title: 'Docker Basics', content: 'Containers, images, Dockerfile, docker-compose', videoUrl: 'https://www.youtube.com/embed/fqMOX6JJhGo', duration: 1000, courseId: courses[7]._id, order: 1, isPublished: true },
        { title: 'Container Deployment', content: 'Registries, container networks, volumes', videoUrl: 'https://www.youtube.com/embed/V3N1wZvKFWM', duration: 1100, courseId: courses[7]._id, order: 2, isPublished: true },
        { title: 'Kubernetes Architecture', content: 'Pods, services, deployments, kubeconfig', videoUrl: 'https://www.youtube.com/embed/X48VuDVv0FM', duration: 1150, courseId: courses[7]._id, order: 3, isPublished: true },
        { title: 'K8s Advanced', content: 'Ingress, persistent volumes, namespaces', videoUrl: 'https://www.youtube.com/embed/VlvAD4w2hfo', duration: 1200, courseId: courses[7]._id, order: 4, isPublished: true },
        
        // Course 9: Machine Learning
        { title: 'ML Fundamentals', content: 'Supervised vs unsupervised, training/testing', videoUrl: 'https://www.youtube.com/embed/aircAruvnKk', duration: 1000, courseId: courses[8]._id, order: 1, isPublished: true },
        { title: 'Linear Regression', content: 'Regression models, loss functions, optimization', videoUrl: 'https://www.youtube.com/embed/4qVRBYAdVQg', duration: 950, courseId: courses[8]._id, order: 2, isPublished: true },
        { title: 'Classification Models', content: 'Logistic regression, decision trees, SVM', videoUrl: 'https://www.youtube.com/embed/E-4Onv0cMls', duration: 1100, courseId: courses[8]._id, order: 3, isPublished: true },
        { title: 'Neural Networks', content: 'Deep learning, backpropagation, TensorFlow', videoUrl: 'https://www.youtube.com/embed/BR9h47Jtqyw', duration: 1250, courseId: courses[8]._id, order: 4, isPublished: true },
        
        // Course 10: TypeScript
        { title: 'TS Basics', content: 'Types, interfaces, type annotations', videoUrl: 'https://www.youtube.com/embed/Z1ta2Z2-Gbw', duration: 850, courseId: courses[9]._id, order: 1, isPublished: true },
        { title: 'Advanced Types', content: 'Union types, generics, conditional types', videoUrl: 'https://www.youtube.com/embed/7p5V2a5hqbg', duration: 950, courseId: courses[9]._id, order: 2, isPublished: true },
        { title: 'Decorators & Metadata', content: 'Decorators, metadata, reflection', videoUrl: 'https://www.youtube.com/embed/nIqVp-7gSFQ', duration: 900, courseId: courses[9]._id, order: 3, isPublished: true },
        { title: 'TS with Express', content: 'TypeScript in Node.js, Express apps', videoUrl: 'https://www.youtube.com/embed/PFP0oXNNPDw', duration: 1000, courseId: courses[9]._id, order: 4, isPublished: true }
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

      const allCourses = await Course.find();
      const quizzesData = [
        // Course 1: JavaScript
        { courseTitle: 'Intro to JavaScript', title: 'JavaScript Basics Quiz', description: 'Kiểm tra kiến thức cơ bản về JavaScript', questions: [
          { question: 'typeof 42 trả về giá trị nào?', options: ['string', 'number', 'object', 'undefined'], correctAnswer: 1, explanation: 'typeof operator trả về "number" cho các số nguyên', points: 1 },
          { question: 'Hàm nào để tìm độ dài của một mảng?', options: ['len()', 'length()', 'length', 'size'], correctAnswer: 2, explanation: 'length là một thuộc tính của mảng', points: 1 },
          { question: 'Phạm vi của biến khai báo với var là gì?', options: ['Global', 'Function scope', 'Block scope', 'Local scope'], correctAnswer: 1, explanation: 'var có function scope', points: 1 }
        ], passingScore: 60, maxAttempts: 3, timeLimit: 15 },

        // Course 2: Advanced Node.js - Multiple quizzes
        { courseTitle: 'Advanced Node.js', title: 'Node.js Architecture Quiz', description: 'Kiểm tra kiến thức Event Loop', questions: [
          { question: 'Event Loop có bao nhiêu phase?', options: ['3', '4', '5', '6'], correctAnswer: 3, explanation: 'Event Loop có 6 phase', points: 2 },
          { question: 'setImmediate() ở phase nào?', options: ['Timers', 'Check', 'Poll', 'Close'], correctAnswer: 1, explanation: 'setImmediate ở phase Check', points: 2 },
          { question: 'Callback nào thực thi trước?', options: ['setTimeout(0)', 'setImmediate()', 'Process.nextTick()', 'setInterval()'], correctAnswer: 2, explanation: 'Process.nextTick có ưu tiên cao nhất', points: 2 }
        ], passingScore: 70, maxAttempts: 2, timeLimit: 20 },
        { courseTitle: 'Advanced Node.js', title: 'Express.js Best Practices', description: 'Kiểm tra middleware và routing', questions: [
          { question: 'Thứ tự đúng cho middleware?', options: ['Routes → Middleware', 'Middleware → Routes → Error handler', 'Error handler first', 'Không quan trọng'], correctAnswer: 1, explanation: 'Middleware phải trước routes', points: 2 },
          { question: 'next() làm gì?', options: ['Chuyển middleware tiếp theo', 'Kết thúc request', 'Gửi response', 'Xóa session'], correctAnswer: 0, explanation: 'next() chuyển sang middleware kế tiếp', points: 1 }
        ], passingScore: 50, maxAttempts: 5, timeLimit: 15 },

        // Course 3: React.js
        { courseTitle: 'React.js Fundamentals', title: 'React Basics Quiz', description: 'Kiểm tra React components', questions: [
          { question: 'React component là gì?', options: ['HTML', 'JavaScript function/class', 'CSS', 'Database'], correctAnswer: 1, explanation: 'React components là functions hoặc classes', points: 1 },
          { question: 'Props là gì?', options: ['Biến local', 'Dữ liệu từ parent component', 'State', 'Event handler'], correctAnswer: 1, explanation: 'Props truyền dữ liệu từ parent', points: 1 },
          { question: 'Khi nào sử dụng State?', options: ['Lúc nào cũng', 'Dữ liệu thay đổi', 'Dữ liệu tĩnh', 'Không bao giờ'], correctAnswer: 1, explanation: 'State cho dữ liệu động', points: 1 }
        ], passingScore: 60, maxAttempts: 3, timeLimit: 20 },
        { courseTitle: 'React.js Fundamentals', title: 'React Hooks Deep Dive', description: 'Kiểm tra Hooks và state management', questions: [
          { question: 'useState trả về cái gì?', options: ['String', '[state, setState]', 'Object', 'Function'], correctAnswer: 1, explanation: 'useState trả về array [state, setState]', points: 2 },
          { question: 'useEffect dùng khi nào?', options: ['Render', 'Component mount/update', 'PropTypes', 'Router'], correctAnswer: 1, explanation: 'useEffect chạy sau render', points: 2 }
        ], passingScore: 70, maxAttempts: 3, timeLimit: 18 },

        // Course 4: Python Data Science
        { courseTitle: 'Python for Data Science', title: 'NumPy & Pandas Quiz', description: 'Kiểm tra NumPy và Pandas', questions: [
          { question: 'NumPy array là gì?', options: ['List', 'N-dimensional array', 'Dictionary', 'Set'], correctAnswer: 1, explanation: 'NumPy arrays là multi-dimensional', points: 1 },
          { question: 'Pandas Series là gì?', options: ['Chuỗi số', '1D array với index', '2D array', 'Database'], correctAnswer: 1, explanation: 'Series là 1D array với index', points: 1 },
          { question: 'DataFrame dùng để gì?', options: ['Số', 'Text', 'Dữ liệu 2D (bảng)', 'Image'], correctAnswer: 2, explanation: 'DataFrame là bảng 2D', points: 1 }
        ], passingScore: 65, maxAttempts: 3, timeLimit: 20 },
        { courseTitle: 'Python for Data Science', title: 'Scikit-learn Quiz', description: 'Kiểm tra Machine Learning basics', questions: [
          { question: 'Supervised learning là gì?', options: ['Tự học', 'Có labels', 'Không có labels', 'Ngẫu nhiên'], correctAnswer: 1, explanation: 'Supervised learning có target labels', points: 2 },
          { question: 'Train/test split tỉ lệ nào phổ biến?', options: ['50/50', '80/20', '70/30', 'Không quan trọng'], correctAnswer: 1, explanation: '80/20 là tỉ lệ phổ biến', points: 1 }
        ], passingScore: 60, maxAttempts: 2, timeLimit: 18 },

        // Course 5: CSS & Responsive
        { courseTitle: 'CSS & Responsive Design', title: 'CSS Fundamentals Quiz', description: 'Kiểm tra CSS cơ bản', questions: [
          { question: 'Box model bao gồm gì?', options: ['Width', 'Content, padding, border, margin', 'Height', 'Color'], correctAnswer: 1, explanation: 'Box model: content, padding, border, margin', points: 2 },
          { question: 'Specificity nào cao nhất?', options: ['tag', '.class', '#id', 'inline style'], correctAnswer: 3, explanation: 'Inline style có specificity cao nhất', points: 2 }
        ], passingScore: 70, maxAttempts: 3, timeLimit: 20 },
        { courseTitle: 'CSS & Responsive Design', title: 'Flexbox Quiz', description: 'Kiểm tra Flexbox layout', questions: [
          { question: 'Flexbox main axis là?', options: ['Vertical', 'Horizontal', 'Diagonal', 'Không có'], correctAnswer: 1, explanation: 'Main axis mặc định horizontal', points: 1 },
          { question: 'justify-content căn chỉnh theo?', options: ['Cross axis', 'Main axis', 'Diagonal', 'Cả hai'], correctAnswer: 1, explanation: 'justify-content căn theo main axis', points: 1 }
        ], passingScore: 60, maxAttempts: 3, timeLimit: 15 },

        // Course 6: SQL Database
        { courseTitle: 'Database Design with SQL', title: 'SQL Basics Quiz', description: 'Kiểm tra SQL cơ bản', questions: [
          { question: 'SELECT * FROM table WHERE age > 18 lấy gì?', options: ['Tất cả tuples', 'Tuples có age > 18', 'Tuples có age < 18', 'Cột age'], correctAnswer: 1, explanation: 'WHERE age > 18 lọc tuples', points: 1 },
          { question: 'ORDER BY ASC là gì?', options: ['Giảm dần', 'Tăng dần', 'Ngẫu nhiên', 'Không sắp xếp'], correctAnswer: 1, explanation: 'ASC = ascending (tăng dần)', points: 1 }
        ], passingScore: 60, maxAttempts: 3, timeLimit: 18 },
        { courseTitle: 'Database Design with SQL', title: 'SQL Joins Quiz', description: 'Kiểm tra SQL joins', questions: [
          { question: 'INNER JOIN trả về gì?', options: ['Tất cả từ trái', 'Tất cả từ phải', 'Chỉ khớp', 'Tất cả'], correctAnswer: 2, explanation: 'INNER JOIN chỉ khớp', points: 2 },
          { question: 'LEFT JOIN khác INNER JOIN ở?', options: ['Speed', 'Giữ tuples từ bảng trái', 'Column order', 'Syntax'], correctAnswer: 1, explanation: 'LEFT JOIN giữ tất cả từ bảng trái', points: 2 }
        ], passingScore: 70, maxAttempts: 2, timeLimit: 20 },

        // Course 7: Vue.js
        { courseTitle: 'Vue.js Complete Guide', title: 'Vue Basics Quiz', description: 'Kiểm tra Vue fundamentals', questions: [
          { question: 'v-model dùng để?', options: ['Loop', 'Conditional', 'Two-way binding', 'Event'], correctAnswer: 2, explanation: 'v-model là two-way data binding', points: 1 },
          { question: 'v-for dùng để?', options: ['Render lặp', 'Conditional', 'Binding', 'Event'], correctAnswer: 0, explanation: 'v-for lặp qua array/object', points: 1 }
        ], passingScore: 60, maxAttempts: 3, timeLimit: 15 },
        { courseTitle: 'Vue.js Complete Guide', title: 'Vuex Quiz', description: 'Kiểm tra state management', questions: [
          { question: 'Vuex Store bao gồm?', options: ['State, Mutations, Actions, Getters', 'Functions', 'Components', 'Routes'], correctAnswer: 0, explanation: 'Vuex có State, Mutations, Actions, Getters', points: 2 },
          { question: 'Mutations dùng để?', options: ['Async operations', 'Thay đổi state', 'Get data', 'Route'], correctAnswer: 1, explanation: 'Mutations thay đổi state đồng bộ', points: 2 }
        ], passingScore: 70, maxAttempts: 2, timeLimit: 18 },

        // Course 8: Docker & Kubernetes
        { courseTitle: 'Docker & Kubernetes', title: 'Docker Quiz', description: 'Kiểm tra Docker', questions: [
          { question: 'Container là gì?', options: ['VM', 'Lightweight process', 'Image', 'Network'], correctAnswer: 1, explanation: 'Container là lightweight isolated process', points: 1 },
          { question: 'Dockerfile dùng để?', options: ['Config', 'Define image', 'Deploy', 'Test'], correctAnswer: 1, explanation: 'Dockerfile định nghĩa cách build image', points: 1 },
          { question: 'Docker image là gì?', options: ['Container running', 'Blueprint', 'Volume', 'Network'], correctAnswer: 1, explanation: 'Image là blueprint cho containers', points: 1 }
        ], passingScore: 65, maxAttempts: 3, timeLimit: 20 },
        { courseTitle: 'Docker & Kubernetes', title: 'Kubernetes Quiz', description: 'Kiểm tra K8s', questions: [
          { question: 'Pod là gì?', options: ['Deployment', 'Smallest unit', 'Service', 'Volume'], correctAnswer: 1, explanation: 'Pod là smallest deployable unit', points: 2 },
          { question: 'Service dùng để?', options: ['Deploy', 'Expose pods', 'Config', 'Logs'], correctAnswer: 1, explanation: 'Service expose pods để access', points: 2 }
        ], passingScore: 70, maxAttempts: 2, timeLimit: 20 },

        // Course 9: Machine Learning
        { courseTitle: 'Machine Learning Basics', title: 'ML Concepts Quiz', description: 'Kiểm tra ML fundamentals', questions: [
          { question: 'Supervised learning là?', options: ['Tự học', 'Có target labels', 'Random', 'No data'], correctAnswer: 1, explanation: 'Supervised có target labels', points: 1 },
          { question: 'Overfitting là?', options: ['Too simple', 'Too complex, memorize', 'Good fit', 'No fit'], correctAnswer: 1, explanation: 'Overfitting: model memorize training data', points: 2 },
          { question: 'Training data dùng để?', options: ['Test', 'Teach model', 'Validate', 'Deploy'], correctAnswer: 1, explanation: 'Training data để teach model', points: 1 }
        ], passingScore: 65, maxAttempts: 3, timeLimit: 20 },
        { courseTitle: 'Machine Learning Basics', title: 'Neural Networks Quiz', description: 'Kiểm tra Deep Learning', questions: [
          { question: 'Neuron có bao nhiêu input?', options: ['1', 'Multiple', '0', 'Không giới hạn'], correctAnswer: 1, explanation: 'Neuron có multiple inputs', points: 2 },
          { question: 'Backpropagation là?', options: ['Forward pass', 'Gradient descent', 'Prediction', 'Data prep'], correctAnswer: 1, explanation: 'Backpropagation để update weights', points: 2 }
        ], passingScore: 70, maxAttempts: 2, timeLimit: 22 },

        // Course 10: TypeScript
        { courseTitle: 'TypeScript Professional', title: 'TypeScript Basics Quiz', description: 'Kiểm tra TS cơ bản', questions: [
          { question: 'TypeScript là gì?', options: ['JavaScript', 'Superset of JS', 'Framework', 'Database'], correctAnswer: 1, explanation: 'TypeScript là superset của JavaScript', points: 1 },
          { question: 'Type annotation syntax?', options: [':type', 'typeof', '#type', '->type'], correctAnswer: 0, explanation: 'Syntax: variableName: type', points: 1 },
          { question: 'Interface dùng để?', options: ['Inheritance', 'Define contract', 'Styling', 'Database'], correctAnswer: 1, explanation: 'Interface define object structure', points: 1 }
        ], passingScore: 65, maxAttempts: 3, timeLimit: 18 },
        { courseTitle: 'TypeScript Professional', title: 'Advanced TypeScript Quiz', description: 'Kiểm tra TS advanced', questions: [
          { question: 'Generics là gì?', options: ['Database', 'Reusable types', 'Functions', 'Classes'], correctAnswer: 1, explanation: 'Generics tạo reusable typed components', points: 2 },
          { question: 'Union type syntax?', options: ['&', '|', '^', '*'], correctAnswer: 1, explanation: 'Union type: type1 | type2', points: 2 }
        ], passingScore: 70, maxAttempts: 2, timeLimit: 20 }
      ];

      for (const quizData of quizzesData) {
        const course = allCourses.find(c => c.title === quizData.courseTitle);
        if (course) {
          await Quiz.create({
            title: quizData.title,
            description: quizData.description,
            questions: quizData.questions,
            courseId: course._id,
            passingScore: quizData.passingScore,
            maxAttempts: quizData.maxAttempts,
            timeLimit: quizData.timeLimit,
            isPublished: true
          });
        }
      }
      console.log('Created all quizzes');
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
