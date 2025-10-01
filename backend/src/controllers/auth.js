const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { success, error } = require('../utils/response');

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

const register = async (req, res) => {
  try {
    const { username, password, phone, userType } = req.body;

    if (!username || !password || !phone || !userType) {
      return error(res, 'All fields are required', 400);
    }

    const existingUser = await User.findOne({
      $or: [{ username }, { phone }]
    });

    if (existingUser) {
      return error(res, 'Username or phone already exists', 400);
    }

    const user = new User({ username, password, phone, userType });
    await user.save();

    const token = generateToken(user._id);

    const userResponse = {
      id: user._id,
      username: user.username,
      phone: user.phone,
      userType: user.userType
    };

    success(res, 'User registered successfully', { user: userResponse, token }, 201);
  } catch (err) {
    console.error('Registration error:', err);
    error(res, 'Registration failed', 500);
  }
};

const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return error(res, 'Username and password are required', 400);
    }

    const user = await User.findOne({ username }).select('+password');
    
    if (!user) {
      return error(res, 'Invalid credentials', 401);
    }

    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      return error(res, 'Invalid credentials', 401);
    }

    const token = generateToken(user._id);

    const userResponse = {
      id: user._id,
      username: user.username,
      phone: user.phone,
      userType: user.userType
    };

    success(res, 'Login successful', { user: userResponse, token });
  } catch (err) {
    console.error('Login error:', err);
    error(res, 'Login failed', 500);
  }
};

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return error(res, 'User not found', 404);
    }
    success(res, 'Profile retrieved', user);
  } catch (err) {
    error(res, 'Failed to get profile', 500);
  }
};

const updateProfile = async (req, res) => {
  try {
    const { phone } = req.body;
    const user = await User.findByIdAndUpdate(req.user.id, { phone }, { new: true });
    success(res, 'Profile updated', user);
  } catch (err) {
    error(res, 'Failed to update profile', 500);
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id).select('+password');
    
    const isValid = await user.comparePassword(currentPassword);
    if (!isValid) {
      return error(res, 'Current password is incorrect', 400);
    }

    user.password = newPassword;
    await user.save();
    
    success(res, 'Password changed successfully');
  } catch (err) {
    error(res, 'Failed to change password', 500);
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword
};
