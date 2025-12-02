const express = require('express');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');

// Load env vars
dotenv.config();

// Connect to database
const connectDB = require('./config/database');
connectDB();

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: ['http://localhost:3001', process.env.CLIENT_URL],
  credentials: true
}));

// 🚨 FIX: BODY PARSER PHẢI ĐỨNG TRƯỚC RATE LIMITING
app.use(express.json({
  verify: (req, res, buf) => {
    if (req.originalUrl.startsWith('/v2/payments/webhook')) {
      req.rawBody = buf.toString();
    }
  }
}));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Security middleware
app.use(mongoSanitize());
app.use(xss());
app.use(hpp());

// Rate limiting - ĐẶT SAU BODY PARSER
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: 'Too many requests from this IP',
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting
app.use('/v2/auth', authLimiter);
app.use('/v2/', generalLimiter);

// Routes
app.use('/v2/auth', require('./routes/auth'));
app.use('/v2/users', require('./routes/users'));
app.use('/v2/courses', require('./routes/courses'));
app.use('/v2/enrollments', require('./routes/enrollments'));
app.use('/v2/payments', require('./routes/payments'));
app.use('/v2/files', require('./routes/files'));
app.use('/v2/lessons', require('./routes/lessons'));
app.use('/v2/quizzes', require('./routes/quizzes'));
app.use('/v2/progress', require('./routes/progress'));

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'WEBHOC Backend API'
  });
});

// Error handling middleware
app.use(require('./middleware/errorMiddleware'));

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 WEBHOC Backend running on port ${PORT}`);
  console.log(`📚 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});