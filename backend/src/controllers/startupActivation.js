const crypto = require('crypto');
const Startup = require('../models/Startup');
const Incubator = require('../models/Incubator');
const User = require('../models/User');
const { success, error } = require('../utils/response');

// Get startup credentials (for incubator to download)
const getStartupCredentials = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Find incubator
    const incubator = await Incubator.findOne({ userId });
    
    if (!incubator) {
      return error(res, 'Incubator profile not found', 404);
    }
    
    console.log('Finding startups for incubator:', incubator._id);
    
    // Find all startups imported by this incubator
    const startups = await Startup.find({
      importedBy: incubator._id
    }).populate('userId', 'phoneNumber').sort({ importedAt: -1 });
    
    console.log('Found startups:', startups.length);
    
    // Format credentials
    const credentials = startups.map(s => {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      
      return {
        companyName: s.companyName,
        email: s.email || '',
        phone: s.phone || s.userId?.phoneNumber || '',
        tempPassword: s.tempPassword || 'N/A',
        activationLink: s.activationToken 
          ? `${frontendUrl}/startup-activate/${s.activationToken}`
          : 'N/A',
        activated: s.activated || false
      };
    });
    
    console.log('Returning credentials:', credentials.length);
    
    success(res, 'Credentials retrieved', {
      total: credentials.length,
      credentials
    });
    
  } catch (err) {
    console.error('Get Credentials Error:', err);
    error(res, err.message, 500);
  }
};

// Activate startup account (public route)
const activateStartup = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    
    if (!token || !newPassword) {
      return error(res, 'Token and new password are required', 400);
    }
    
    if (newPassword.length < 6) {
      return error(res, 'Password must be at least 6 characters', 400);
    }
    
    // Find startup by token
    const startup = await Startup.findOne({
      activationToken: token,
      activationTokenExpiry: { $gt: new Date() }
    }).populate('userId');
    
    if (!startup) {
      return error(res, 'Invalid or expired activation token', 400);
    }
    
    if (startup.activated) {
      return error(res, 'Account already activated', 400);
    }
    
    // Update user password
    const user = startup.userId;
    user.password = newPassword;
    await user.save();
    
    // Mark as activated
    startup.activated = true;
    startup.activationToken = undefined;
    startup.tempPassword = undefined;
    startup.lastLoginAt = new Date();
    await startup.save();
    
    success(res, 'Account activated successfully! You can now login.', {
      phoneNumber: user.phoneNumber,
      companyName: startup.companyName
    });
    
  } catch (err) {
    console.error('Activation Error:', err);
    error(res, err.message, 500);
  }
};

// Verify activation token (before showing password form)
const verifyActivationToken = async (req, res) => {
  try {
    const { token } = req.params;
    
    const startup = await Startup.findOne({
      activationToken: token,
      activationTokenExpiry: { $gt: new Date() }
    }).select('companyName email activated');
    
    if (!startup) {
      return error(res, 'Invalid or expired activation token', 400);
    }
    
    if (startup.activated) {
      return error(res, 'Account already activated', 400);
    }
    
    success(res, 'Token verified', {
      companyName: startup.companyName,
      email: startup.email
    });
    
  } catch (err) {
    console.error('Verify Token Error:', err);
    error(res, err.message, 500);
  }
};

// Resend activation (if startup lost credentials)
const resendActivation = async (req, res) => {
  try {
    const { email } = req.body;
    
    const startup = await Startup.findOne({ 
      email, 
      activated: false 
    });
    
    if (!startup) {
      return error(res, 'No pending activation found for this email', 404);
    }
    
    // Generate new token if expired
    if (new Date() > startup.activationTokenExpiry) {
      startup.activationToken = crypto.randomBytes(32).toString('hex');
      startup.activationTokenExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      await startup.save();
    }
    
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    
    success(res, 'Activation link sent (in production, this would be emailed)', {
      activationLink: `${frontendUrl}/startup-activate/${startup.activationToken}`,
      tempPassword: startup.tempPassword
    });
    
  } catch (err) {
    console.error('Resend Activation Error:', err);
    error(res, err.message, 500);
  }
};

module.exports = {
  getStartupCredentials,
  activateStartup,
  verifyActivationToken,
  resendActivation
};
