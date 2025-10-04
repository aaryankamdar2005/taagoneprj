const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const investorController = require('../controllers/investor');

// Test route
router.get('/test', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Investor routes are working!',
    timestamp: new Date()
  });
});

// Protected routes - require investor authentication
router.use(authenticate);
router.use(authorize('investor'));

// Dashboard & Profile
router.get('/dashboard', investorController.getDashboard);
router.get('/profile', investorController.getProfile);
router.put('/profile', investorController.updateProfile);
// Add this BEFORE the protected routes
router.get('/debug/startup/:startupId', authenticate, async (req, res) => {
  try {
    const { startupId } = req.params;
    const Startup = require('../models/Startup');
    
    // Check if ID is valid
    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(startupId)) {
      return res.json({ error: 'Invalid ObjectId format' });
    }

    // Find startup WITHOUT isPublic filter
    const startup = await Startup.findById(startupId);
    
    if (!startup) {
      return res.json({ 
        success: false, 
        message: 'Startup does not exist in database',
        startupId 
      });
    }

    res.json({
      success: true,
      message: 'Debug: Startup found',
      data: {
        _id: startup._id,
        companyName: startup.companyName,
        isPublic: startup.isPublic,
        industry: startup.industry,
        stage: startup.stage,
        userId: startup.userId
      }
    });
  } catch (err) {
    res.json({ error: err.message });
  }
});
// Update the existing debug route in src/routes/investor.js
router.get('/debug/startups', authenticate, async (req, res) => {
  try {
    const Startup = require('../models/Startup');
    const startups = await Startup.find({}) // No filter - show ALL
      .select('companyName industry stage fundingAsk isPublic userId');
    
    res.json({
      success: true,
      message: 'Debug: All startups in database (including private)',
      data: {
        total: startups.length,
        startups: startups.map(s => ({
          _id: s._id,
          companyName: s.companyName,
          industry: s.industry,
          stage: s.stage,
          isPublic: s.isPublic, // This is key!
          userId: s.userId,
          fundingAmount: s.fundingAsk?.amount
        }))
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Startup Discovery & Details
router.get('/startups/:startupId', investorController.getStartupDetails);

// Investor Actions
router.post('/startups/:startupId/intro-request', investorController.requestIntroduction);
router.post('/startups/:startupId/soft-commit', investorController.makeSoftCommitment);

router.post('/commitments/:commitmentId/convert', investorController.convertCommitmentToInvestment);
router.post('/commitments/:commitmentId/withdraw', investorController.withdrawCommitment);
module.exports = router;
