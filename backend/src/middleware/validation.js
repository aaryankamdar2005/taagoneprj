const { error } = require('../utils/response');

// Validate registration data
exports.validateRegistration = (req, res, next) => {
  const { username, password, phone, userType } = req.body;
  const errors = [];

  // Username validation
  if (!username || username.trim().length < 3) {
    errors.push('Username must be at least 3 characters long');
  }

  if (username && username.length > 50) {
    errors.push('Username cannot exceed 50 characters');
  }

  if (username && !/^[a-zA-Z0-9_]+$/.test(username)) {
    errors.push('Username can only contain letters, numbers, and underscores');
  }

  // Password validation
  if (!password || password.length < 6) {
    errors.push('Password must be at least 6 characters long');
  }

  if (password && password.length > 100) {
    errors.push('Password cannot exceed 100 characters');
  }

  // Phone validation
  if (!phone || phone.trim().length < 10) {
    errors.push('Phone number must be at least 10 digits');
  }

  if (phone && !/^\+?[\d\s\-\(\)]+$/.test(phone)) {
    errors.push('Invalid phone number format');
  }

  // UserType validation
  if (!userType || !['startup', 'investor'].includes(userType)) {
    errors.push('User type must be either "startup" or "investor"');
  }

  if (errors.length > 0) {
    return error(res, 'Validation failed', 400, errors);
  }

  next();
};

// Validate login data
exports.validateLogin = (req, res, next) => {
  const { username, password } = req.body;
  const errors = [];

  if (!username || username.trim().length === 0) {
    errors.push('Username is required');
  }

  if (!password || password.length === 0) {
    errors.push('Password is required');
  }

  if (errors.length > 0) {
    return error(res, 'Validation failed', 400, errors);
  }

  next();
};

// Validate startup pitch data
exports.validateStartupPitch = (req, res, next) => {
  const { companyName, oneLineDescription, fundingAmount, timeline, useOfFunds, keyTractionPoints } = req.body;
  const errors = [];

  // Required fields
  if (!companyName || companyName.trim().length === 0) {
    errors.push('Company name is required');
  }

  if (!oneLineDescription || oneLineDescription.trim().length === 0) {
    errors.push('One-line description is required');
  }

  if (!fundingAmount || typeof fundingAmount !== 'number') {
    errors.push('Funding amount is required and must be a number');
  }

  if (!timeline || !['Immediate', '1-3 months', '3-6 months', '6+ months'].includes(timeline)) {
    errors.push('Valid timeline is required');
  }

  if (!useOfFunds || useOfFunds.trim().length === 0) {
    errors.push('Use of funds is required');
  }

  if (!keyTractionPoints || keyTractionPoints.trim().length === 0) {
    errors.push('Key traction points are required');
  }

  // Length validations
  if (companyName && companyName.length > 100) {
    errors.push('Company name cannot exceed 100 characters');
  }

  if (oneLineDescription && oneLineDescription.length > 200) {
    errors.push('One-line description cannot exceed 200 characters');
  }

  if (errors.length > 0) {
    return error(res, 'Validation failed', 400, errors);
  }

  next();
};
