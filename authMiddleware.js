const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        statusCode: 401,
        message: 'Unauthorized: No token provided'
      });
    }

    const token = authHeader.split(' ')[1];
    
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    
    // Check if user still exists and is active
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        statusCode: 401,
        message: 'Unauthorized: User no longer exists'
      });
    }

    req.user = {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      isEmailVerified: user.isEmailVerified
    };
    
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        statusCode: 401,
        message: 'Unauthorized: Token expired'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        statusCode: 401,
        message: 'Unauthorized: Invalid token'
      });
    }
    
    next(error);
  }
};

const isInstructor = (req, res, next) => {
  if (req.user.role !== 'instructor' && req.user.role !== 'admin') {
    return res.status(403).json({
      statusCode: 403,
      message: 'Forbidden: Instructor access required'
    });
  }
  next();
};

const isStudent = (req, res, next) => {
  if (req.user.role !== 'student') {
    return res.status(403).json({
      statusCode: 403,
      message: 'Forbidden: Student access required'
    });
  }
  next();
};

const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      statusCode: 403,
      message: 'Forbidden: Admin access required'
    });
  }
  next();
};

module.exports = {
  authMiddleware,
  isInstructor,
  isStudent,
  isAdmin
};