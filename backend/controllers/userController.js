const User = require('../models/User');

// @desc    Get current user profile
// @route   GET /v2/users/me
// @access  Private
const getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        statusCode: 404,
        message: 'User not found'
      });
    }

    res.json(user);
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile
// @route   PATCH /v2/users/me
// @access  Private
const updateUserProfile = async (req, res, next) => {
  try {
    const { displayName, bio, profileImageUrl } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        displayName,
        bio,
        profileImageUrl
      },
      { 
        new: true,
        runValidators: true 
      }
    );

    res.json(user);
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

module.exports = {
  getUserProfile,
  updateUserProfile
};