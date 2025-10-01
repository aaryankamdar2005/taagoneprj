const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

// Register route
router.post('/register', async (req, res) => {
  try {
    const { phoneNumber, password, userType } = req.body;

    // Validation
    if (!phoneNumber || !password || !userType) {
      return res.status(400).json({
        success: false,
        message: 'Phone number, password, and user type are required'
      });
    }

    // Validate user type
    if (!['investor', 'startup', 'incubator'].includes(userType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user type'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ phoneNumber });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this phone number already exists'
      });
    }

    // Create new user
    const user = new User({
      phoneNumber,
      password,
      userType
    });

    await user.save();

    // Generate token for immediate login
    const token = jwt.sign(
      { 
        userId: user._id,
        phoneNumber: user.phoneNumber,
        userType: user.userType
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: {
        id: user._id,
        phoneNumber: user.phoneNumber,
        userType: user.userType
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
});

// Login route - phone number + password + route-based userType
router.post('/login', async (req, res) => {
  try {
    const { phoneNumber, password, userType } = req.body;

    // Validation
    if (!phoneNumber || !password || !userType) {
      return res.status(400).json({
        success: false,
        message: 'Phone number, password, and user type are required'
      });
    }

    // Validate phone number format
    if (!/^[0-9]{10}$/.test(phoneNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid 10-digit phone number'
      });
    }

    // Validate user type
    if (!['investor', 'startup', 'incubator'].includes(userType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user type'
      });
    }

    // Find user by phone number AND user type
    const user = await User.findOne({ 
      phoneNumber,
      userType
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: `No ${userType} account found with this phone number`
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid phone number or password'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id,
        phoneNumber: user.phoneNumber,
        userType: user.userType
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      success: true,
      message: `${userType} login successful`,
      token,
      user: {
        id: user._id,
        phoneNumber: user.phoneNumber,
        userType: user.userType,
        createdAt: user.createdAt
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login. Please try again.'
    });
  }
});
// Get current user route
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        phoneNumber: user.phoneNumber,
        userType: user.userType
      }
    });

  } catch (error) {
    console.error('Auth verification error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
});

module.exports = router;
