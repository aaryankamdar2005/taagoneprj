const Investor = require('../models/Investor');
const Startup = require('../models/Startup');
const { success, error } = require('../utils/response');
const { getMatchedStartups } = require('../utils/matchingAlgorithm');

// Get Investor Dashboard with Matched Startups
const getDashboard = async (req, res) => {
  try {
    const userId = req.user.id;
    
    let investor = await Investor.findOne({ userId })
      .populate('portfolioCompanies.startupId', 'companyName logoUrl industry stage')
      .populate('softCommitments.startupId', 'companyName logoUrl')
      .populate('introRequests.startupId', 'companyName logoUrl');

    if (!investor) {
      return error(res, 'Investor profile not found. Please complete your profile first.', 404);
    }

    // Get matched startups
    const matchedStartups = await getMatchedStartups(investor, 10);

    // Recent activity
    const recentActivity = investor.startupInteractions
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 10);

    // Active soft commitments
    const activeSoftCommitments = investor.softCommitments
      .filter(commit => commit.status === 'active')
      .slice(0, 5);

    // Pending intro requests
    const pendingIntroRequests = investor.introRequests
      .filter(req => req.status === 'pending')
      .slice(0, 5);

    const dashboardData = {
      investorInfo: {
        investorName: investor.investorName,
        investorType: investor.investorType,
        preferences: investor.investmentPreferences,
        capacity: investor.investmentCapacity
      },
      matchedStartups,
      portfolio: {
        companies: investor.portfolioCompanies,
        totalInvestments: investor.portfolioCompanies.length,
        totalInvested: investor.investmentCapacity.currentlyInvested
      },
      activities: {
        recentActivity,
        activeSoftCommitments,
        pendingIntroRequests
      }
    };

    success(res, 'Investor dashboard retrieved successfully', dashboardData);
  } catch (err) {
    console.error('Investor dashboard error:', err);
    error(res, err.message, 500);
  }
};

// Get Detailed Startup View
// Get Detailed Startup View
const getStartupDetails = async (req, res) => {
  try {
    const { startupId } = req.params;
    const userId = req.user.id;

    const startup = await Startup.findById(startupId)
      .populate('userId', 'username phone');

 if (!startup) {
  return error(res, 'Startup not found', 404);
}

    // Track view activity
    const investor = await Investor.findOne({ userId });
    if (investor) {
      // Check if already viewed today
      const existingView = investor.startupInteractions.find(
        interaction => interaction.startupId.toString() === startupId && 
        interaction.actionType === 'viewed' && 
        new Date() - interaction.date < 24 * 60 * 60 * 1000 // Within 24 hours
      );

      if (!existingView) {
        investor.startupInteractions.push({
          startupId,
          actionType: 'viewed'
        });
        await investor.save();

        // Also track on startup side
        if (!startup.investorActivity) startup.investorActivity = [];
        startup.investorActivity.push({
          investorName: investor.investorName,
          activityType: 'viewed'
        });
        await startup.save();
      }
    }

    // Organize startup details
    const startupDetails = {
      // Overview
      overview: {
        companyName: startup.companyName,
        logoUrl: startup.logoUrl,
        website: startup.website,
        oneLineDescription: startup.oneLineDescription,
        industry: startup.industry,
        stage: startup.stage,
        pitch: startup.pitch || {}
      },

      // The Ask
      funding: {
        currentRound: startup.fundingAsk || {},
        fundraisingSummary: startup.fundraisingSummary || {},
        suggestedInvestments: {
          'Series A': Math.min(50000000, startup.fundingAsk?.amount || 10000000),
          'Seed': Math.min(20000000, startup.fundingAsk?.amount || 5000000),
          'Angel': Math.min(10000000, startup.fundingAsk?.amount || 2500000)
        }
      },

      // Traction & Metrics
      traction: {
        metrics: startup.metrics || {},
        keyTractionPoints: startup.marketInfo?.keyTractionPoints || 'No traction data available',
        fundraisingHistory: startup.fundraisingEntries || []
      },

      // Market
      market: {
        marketSize: startup.marketInfo?.marketSize || 'Market size not specified',
        industry: startup.industry,
        stage: startup.stage
      },

      // Team (basic info)
      team: {
        founder: {
          name: startup.userId?.username || 'Founder',
          phone: startup.userId?.phone
        },
        teamSize: startup.metrics?.teamSize || 1
      },

      // Documents (placeholder)
      documents: startup.documents || [],

      // Investor's interaction history with this startup
      myActivity: investor ? investor.startupInteractions.filter(
        interaction => interaction.startupId.toString() === startupId
      ) : []
    };

    success(res, 'Startup details retrieved successfully', startupDetails);
  } catch (err) {
    console.error('Get startup details error:', err);
    error(res, err.message, 500);
  }
};


// Request Introduction
const requestIntroduction = async (req, res) => {
  try {
    const { startupId } = req.params;
    const { notes } = req.body;
    const userId = req.user.id;

    const investor = await Investor.findOne({ userId });
    if (!investor) {
      return error(res, 'Investor profile not found', 404);
    }

    const startup = await Startup.findById(startupId);
    if (!startup) {
      return error(res, 'Startup not found', 404);
    }

    // Check if intro already requested
    const existingRequest = investor.introRequests.find(
      req => req.startupId.toString() === startupId && req.status === 'pending'
    );

    if (existingRequest) {
      return error(res, 'Introduction already requested', 400);
    }

    // Add intro request
    investor.introRequests.push({
      startupId,
      notes: notes || `${investor.investorName} is interested in learning more about ${startup.companyName}`
    });

    // Track activity
    investor.startupInteractions.push({
      startupId,
      actionType: 'intro-requested',
      notes
    });

    await investor.save();

    // Also track on startup side
    startup.investorActivity.push({
      investorId: investor._id,
      investorName: investor.investorName,
      activityType: 'meeting-requested',
      notes
    });

    await startup.save();

    success(res, 'Introduction requested successfully');
  } catch (err) {
    error(res, err.message, 400);
  }
};

// Make Soft Commitment
const makeSoftCommitment = async (req, res) => {
  try {
    const { startupId } = req.params;
    const { amount, equityExpected, conditions, expiryDays } = req.body;
    const userId = req.user.id;

    if (!amount || amount <= 0) {
      return error(res, 'Valid investment amount is required', 400);
    }

    const investor = await Investor.findOne({ userId });
    if (!investor) {
      return error(res, 'Investor profile not found', 404);
    }

    const startup = await Startup.findById(startupId);
    if (!startup) {
      return error(res, 'Startup not found', 404);
    }

    // Check available funds
    if (investor.investmentCapacity.availableFunds < amount) {
      return error(res, 'Insufficient available funds for this commitment', 400);
    }

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + (expiryDays || 30)); // Default 30 days

    // Add soft commitment
    investor.softCommitments.push({
      startupId,
      amount: Number(amount),
      equityExpected: equityExpected ? Number(equityExpected) : null,
      conditions,
      expiryDate
    });

    // Track activity
    investor.startupInteractions.push({
      startupId,
      actionType: 'soft-commit',
      amount: Number(amount),
      notes: `Soft commitment of ₹${amount.toLocaleString()} made`
    });

    await investor.save();

    // Track on startup side
    startup.investorActivity.push({
      investorId: investor._id,
      investorName: investor.investorName,
      activityType: 'interested',
      amount: Number(amount),
      notes: `Soft commitment of ₹${amount.toLocaleString()}`
    });

    await startup.save();

    success(res, 'Soft commitment made successfully');
  } catch (err) {
    error(res, err.message, 400);
  }
};

// Get Investor Profile
const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const investor = await Investor.findOne({ userId });

    if (!investor) {
      return error(res, 'Investor profile not found', 404);
    }

    success(res, 'Investor profile retrieved successfully', investor);
  } catch (err) {
    error(res, err.message, 500);
  }
};

// Update Investor Profile
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const updates = req.body;

    let investor = await Investor.findOne({ userId });
    
    if (!investor) {
      // Create new investor profile
      investor = new Investor({
        userId,
        investorName: updates.investorName || req.user.username,
        ...updates
      });
    } else {
      // Update existing profile
      Object.keys(updates).forEach(key => {
        if (updates[key] !== undefined) {
          investor[key] = updates[key];
        }
      });
    }

    await investor.save();
    success(res, 'Investor profile updated successfully', investor);
  } catch (err) {
    error(res, err.message, 400);
  }
};

module.exports = {
  getDashboard,
  getStartupDetails,
  requestIntroduction,
  makeSoftCommitment,
  getProfile,
  updateProfile
};
