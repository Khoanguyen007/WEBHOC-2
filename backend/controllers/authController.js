const User = require('../models/User');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken, generateEmailVerificationToken, verifyEmailVerificationToken } = require('../utils/generateTokens');
const { sendVerificationEmail, sendWelcomeEmail } = require('../utils/emailService');

// @desc    Register new user
// @route   POST /v2/auth/signup
// @access  Public
const signup = async (req, res, next) => {
  try {
    const { email, password, displayName, role = 'student' } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        statusCode: 409,
        message: 'Email already exists'
      });
    }

    // Create user
    const user = await User.create({
      email,
      password,
      displayName,
      role: req.body.role === 'admin' ? 'student' : role // Prevent admin self-registration
    });

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Set refresh token as httpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax',
      path: '/v2/auth/refresh',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });

    res.status(201).json({
      accessToken,
      user
    });

    // Send verification email asynchronously (don't block response)
    try {
      const verificationToken = generateEmailVerificationToken(user);
      await sendVerificationEmail(user, verificationToken);
    } catch (mailErr) {
      console.error('Failed to send verification email:', mailErr);
    }

    // Send welcome email as well (optional)
    try {
      await sendWelcomeEmail(user);
    } catch (mailErr) {
      console.error('Failed to send welcome email:', mailErr);
    }
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        statusCode: 400,
        message: 'Validation error',
        details: messages
      });
    }
    next(error);
  }
};

// @desc    Login user
// @route   POST /v2/auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Check if user exists and password is correct
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        statusCode: 401,
        message: 'Invalid email or password'
      });
    }

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Set refresh token as httpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax',
      path: '/v2/auth/refresh',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });

    res.json({
      accessToken,
      user
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Refresh access token
// @route   POST /v2/auth/refresh
// @access  Public (requires refresh token in cookie)
const refresh = async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        statusCode: 401,
        message: 'Refresh token not found in cookie'
      });
    }

    const decoded = verifyRefreshToken(refreshToken);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(403).json({
        statusCode: 403,
        message: 'Invalid, expired, or revoked refresh token'
      });
    }

    const newAccessToken = generateAccessToken(user);

    res.json({
      accessToken: newAccessToken
    });

  } catch (error) {
    return res.status(403).json({
      statusCode: 403,
      message: 'Invalid, expired, or revoked refresh token'
    });
  }
};

// @desc    Logout user
// @route   POST /v2/auth/logout
// @access  Private
const logout = (req, res) => {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Lax',
    path: '/v2/auth/refresh'
  });

  res.json({ message: 'Logout successful' });
};

module.exports = {
  signup,
  login,
  refresh,
  logout
};

// @desc    Verify email token
// @route   POST /v2/auth/verify
// @access  Public
const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ statusCode: 400, message: 'Token is required' });
    }

    let decoded;
    try {
      decoded = verifyEmailVerificationToken(token);
    } catch (err) {
      return res.status(400).json({ statusCode: 400, message: 'Invalid or expired token' });
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ statusCode: 404, message: 'User not found' });
    }

    if (user.isEmailVerified) {
      return res.json({ message: 'Email already verified' });
    }

    user.isEmailVerified = true;
    await user.save();

    res.json({ message: 'Email verified successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports.verifyEmail = verifyEmail;