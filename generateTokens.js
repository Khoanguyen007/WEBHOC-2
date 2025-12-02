const jwt = require('jsonwebtoken');

const generateAccessToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRE || '15m' }
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user._id },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRE || '30d' }
  );
};

const verifyRefreshToken = (token) => {
  return jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
};

const generateEmailVerificationToken = (user) => {
  return jwt.sign(
    { id: user._id },
    process.env.EMAIL_VERIFICATION_SECRET || process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.EMAIL_VERIFICATION_EXPIRE || '1d' }
  );
};

const verifyEmailVerificationToken = (token) => {
  return jwt.verify(token, process.env.EMAIL_VERIFICATION_SECRET || process.env.ACCESS_TOKEN_SECRET);
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken
  , generateEmailVerificationToken
  , verifyEmailVerificationToken
};