const Investor = require('../models/Investor');
const Startup = require('../models/Startup');
const { success, error } = require('../utils/response');
const { getMatchedStartups } = require('../utils/matchingAlgorithm');

// Get Investor Dashboard
const getDashboard = async (req, res) => {
  try {
    const userId = req.user.id;
    
    let investor = await Investor.findOne({ userId })
      .populate('portfolioCompanies.startupId', 'companyName logoUrl industry stage website')
      .populate('softCommitments.startupId', 'companyName logoUrl industry stage')
      .populate('introRequests.startupId', 'companyName logoUrl industry stage')
      .lean();

    if (!investor) {
      return error(res, 'Investor profile not found. Please complete your profile first.', 404);
    }

    console.log('Portfolio Companies Count:', investor.portfolioCompanies?.length);
    console.log('Soft Commitments Count:', investor.softCommitments?.length);

    const matchedStartups = await getMatchedStartups(investor, 10);

    const recentActivity = (investor.startupInteractions || [])
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 10);

    const activeSoftCommitments = (investor.softCommitments || [])
      .filter(commit => commit.status === 'active')
      .map(commit => {
        const daysRemaining = commit.expiryDate 
          ? Math.ceil((new Date(commit.expiryDate) - new Date()) / (1000 * 60 * 60 * 24))
          : null;
        return {
          ...commit,
          daysRemaining,
          type: 'soft-commitment'
        };
      })
      .sort((a, b) => new Date(b.commitDate) - new Date(a.commitDate));

    const portfolioInvestments = (investor.portfolioCompanies || [])
      .map(investment => ({
        _id: investment._id,
        startupId: investment.startupId,
        investmentAmount: investment.investmentAmount,
        equityPercentage: investment.equityPercentage,
        investmentDate: investment.investmentDate,
        currentValuation: investment.currentValuation,
        status: investment.status,
        type: 'portfolio-investment'
      }))
      .sort((a, b) => new Date(b.investmentDate) - new Date(a.investmentDate));

    console.log('Portfolio Investments to send:', portfolioInvestments.length);

    const pendingIntroRequests = (investor.introRequests || [])
      .filter(req => req.status === 'pending')
      .sort((a, b) => new Date(b.requestDate) - new Date(a.requestDate))
      .slice(0, 5);

    const totalCommitted = activeSoftCommitments.reduce((sum, c) => sum + (c.amount || 0), 0);
    const totalInvested = portfolioInvestments.reduce((sum, inv) => sum + (inv.investmentAmount || 0), 0);

    const dashboardData = {
      investorInfo: {
        investorName: investor.investorName,
        investorType: investor.investorType,
        preferences: investor.investmentPreferences,
        capacity: {
          ...investor.investmentCapacity,
          totalCommitted,
          totalInvested,
          currentlyInvested: totalInvested
        }
      },
      matchedStartups,
      portfolio: {
        companies: portfolioInvestments,
        totalInvestments: portfolioInvestments.length,
        totalInvested
      },
      activities: {
        recentActivity,
        activeSoftCommitments,
        portfolioInvestments,
        pendingIntroRequests
      }
    };

    success(res, 'Investor dashboard retrieved successfully', dashboardData);
  } catch (err) {
    console.error('Investor dashboard error:', err);
    error(res, err.message, 500);
  }
};

// Make Soft Commitment - FIXED WITH BETTER VALIDATION
const makeSoftCommitment = async (req, res) => {
  try {
    const { startupId } = req.params;
    const { amount, equityExpected, conditions, expiryDays } = req.body;
    const userId = req.user.id;

    console.log('=== SOFT COMMIT REQUEST ===');
    console.log('StartupId:', startupId);
    console.log('Request body:', { amount, equityExpected, conditions, expiryDays });
    console.log('User ID:', userId);

    // Validation
    if (!amount || isNaN(amount) || amount <= 0) {
      console.log('ERROR: Invalid amount');
      return error(res, 'Valid investment amount is required', 400);
    }

    const investor = await Investor.findOne({ userId });
    if (!investor) {
      console.log('ERROR: Investor not found');
      return error(res, 'Investor profile not found', 404);
    }

    console.log('Found investor:', investor.investorName);

    const startup = await Startup.findById(startupId);
    if (!startup) {
      console.log('ERROR: Startup not found');
      return error(res, 'Startup not found', 404);
    }

    console.log('Found startup:', startup.companyName);

    // ✅ REMOVE STRICT FUNDS CHECK - Allow commitment even without availableFunds set
    // Only check if availableFunds is explicitly set and insufficient
    if (investor.investmentCapacity?.availableFunds !== undefined && 
        investor.investmentCapacity.availableFunds !== null &&
        investor.investmentCapacity.availableFunds < amount) {
      console.log('ERROR: Insufficient funds');
      console.log('Available:', investor.investmentCapacity.availableFunds, 'Required:', amount);
      return error(res, 'Insufficient available funds for this commitment', 400);
    }

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + (expiryDays || 30));

    const commitmentData = {
      startupId,
      amount: Number(amount),
      equityExpected: equityExpected ? Number(equityExpected) : undefined,
      conditions: conditions || undefined,
      expiryDate,
      status: 'active',
      commitDate: new Date()
    };

    console.log('Creating commitment:', commitmentData);

    investor.softCommitments.push(commitmentData);

    investor.startupInteractions.push({
      startupId,
      actionType: 'soft-commit',
      amount: Number(amount),
      date: new Date(),
      notes: `Soft commitment of ₹${amount.toLocaleString()}${equityExpected ? ` for ${equityExpected}% equity` : ''}`
    });

    await investor.save();
    console.log('Investor saved. Total commitments:', investor.softCommitments.length);

    if (!startup.investorActivity) startup.investorActivity = [];
    startup.investorActivity.push({
      investorId: investor._id,
      investorName: investor.investorName,
      investorType: investor.investorType,
      activityType: 'soft-commit',
      amount: Number(amount),
      date: new Date(),
      notes: `Soft commitment of ₹${amount.toLocaleString()}${equityExpected ? ` for ${equityExpected}% equity` : ''}`
    });

    await startup.save();
    console.log('Startup saved with investor activity');

    const newCommitment = investor.softCommitments[investor.softCommitments.length - 1];

    console.log('=== SOFT COMMIT SUCCESS ===');

    success(res, 'Soft commitment made successfully', {
      startupName: startup.companyName,
      amount: Number(amount),
      equityExpected: equityExpected ? Number(equityExpected) : null,
      commitmentId: newCommitment._id.toString(),
      expiryDate
    });
  } catch (err) {
    console.error('=== SOFT COMMIT ERROR ===');
    console.error('Error:', err.message);
    console.error('Stack:', err.stack);
    error(res, err.message, 400);
  }
};

// Convert Soft Commitment to Portfolio Investment
const convertCommitmentToInvestment = async (req, res) => {
  try {
    const { commitmentId } = req.params;
    const { finalAmount, equityPercentage, notes } = req.body;
    const userId = req.user.id;

    console.log('=== CONVERT COMMITMENT ===');
    console.log('Commitment ID:', commitmentId);
    console.log('Request body:', { finalAmount, equityPercentage, notes });
    console.log('User ID:', userId);

    const investor = await Investor.findOne({ userId });
    if (!investor) {
      console.log('ERROR: Investor not found');
      return error(res, 'Investor profile not found', 404);
    }

    console.log('Found investor:', investor.investorName);
    console.log('Soft commitments:', investor.softCommitments.length);
    console.log('Portfolio companies before:', investor.portfolioCompanies.length);

    const commitment = investor.softCommitments.id(commitmentId);
    if (!commitment) {
      console.log('ERROR: Commitment not found');
      console.log('Available IDs:', investor.softCommitments.map(c => c._id.toString()));
      return error(res, 'Commitment not found', 404);
    }

    console.log('Found commitment:', {
      id: commitment._id,
      startupId: commitment.startupId,
      amount: commitment.amount,
      status: commitment.status
    });

    if (commitment.status !== 'active') {
      console.log('ERROR: Commitment not active. Status:', commitment.status);
      return error(res, `Commitment already processed. Status: ${commitment.status}`, 400);
    }

    const startup = await Startup.findById(commitment.startupId);
    if (!startup) {
      console.log('ERROR: Startup not found:', commitment.startupId);
      return error(res, 'Startup not found', 404);
    }

    console.log('Found startup:', startup.companyName);

    const investmentAmount = finalAmount || commitment.amount;
    const equityOwned = equityPercentage || commitment.equityExpected;

    // Add to portfolio
    investor.portfolioCompanies.push({
      startupId: commitment.startupId,
      investmentAmount,
      equityPercentage: equityOwned,
      investmentDate: new Date(),
      currentValuation: investmentAmount,
      status: 'active'
    });

    console.log('Portfolio companies after push:', investor.portfolioCompanies.length);

    // Update capacity
    if (!investor.investmentCapacity) {
      investor.investmentCapacity = {};
    }
    investor.investmentCapacity.currentlyInvested = 
      (investor.investmentCapacity.currentlyInvested || 0) + investmentAmount;
    
    if (investor.investmentCapacity.availableFunds) {
      investor.investmentCapacity.availableFunds -= investmentAmount;
    }

    // Mark commitment as converted
    commitment.status = 'converted';
    commitment.responseDate = new Date();
    commitment.responseNotes = notes || 'Investment completed';

    // Track interaction
    investor.startupInteractions.push({
      startupId: commitment.startupId,
      actionType: 'invested',
      amount: investmentAmount,
      date: new Date(),
      notes: `Converted soft commitment to investment - ${equityOwned}% equity`
    });

    await investor.save();
    console.log('Investor saved');

    // Verify
    const verifyInvestor = await Investor.findById(investor._id);
    console.log('Verification - Portfolio companies:', verifyInvestor.portfolioCompanies.length);

    // Update startup
    if (!startup.investorActivity) startup.investorActivity = [];
    startup.investorActivity.push({
      investorId: investor._id,
      investorName: investor.investorName,
      investorType: investor.investorType,
      activityType: 'invested',
      amount: investmentAmount,
      date: new Date(),
      notes: `Investment completed - ₹${investmentAmount.toLocaleString()} for ${equityOwned}% equity`
    });

    await startup.save();

    console.log('=== CONVERSION SUCCESS ===');

    success(res, 'Investment completed successfully', {
      startupName: startup.companyName,
      investmentAmount,
      equityPercentage: equityOwned,
      portfolioSize: verifyInvestor.portfolioCompanies.length
    });
  } catch (err) {
    console.error('=== CONVERSION ERROR ===');
    console.error('Error:', err.message);
    console.error('Stack:', err.stack);
    error(res, err.message, 400);
  }
};

// Withdraw Soft Commitment
const withdrawCommitment = async (req, res) => {
  try {
    const { commitmentId } = req.params;
    const { reason } = req.body;
    const userId = req.user.id;

    const investor = await Investor.findOne({ userId });
    if (!investor) {
      return error(res, 'Investor profile not found', 404);
    }

    const commitment = investor.softCommitments.id(commitmentId);
    if (!commitment) {
      return error(res, 'Commitment not found', 404);
    }

    if (commitment.status !== 'active') {
      return error(res, 'This commitment cannot be withdrawn', 400);
    }

    commitment.status = 'withdrawn';
    commitment.responseDate = new Date();
    commitment.responseNotes = reason || 'Withdrawn by investor';

    await investor.save();

    success(res, 'Commitment withdrawn successfully', {
      commitmentId,
      status: 'withdrawn'
    });
  } catch (err) {
    console.error('Withdraw commitment error:', err);
    error(res, err.message, 400);
  }
};

// Get Startup Details
const getStartupDetails = async (req, res) => {
  try {
    const { startupId } = req.params;
    const userId = req.user.id;

    const startup = await Startup.findById(startupId)
      .populate('userId', 'username phone');

    if (!startup) {
      return error(res, 'Startup not found', 404);
    }

    const investor = await Investor.findOne({ userId });
    if (investor) {
      const existingView = investor.startupInteractions.find(
        interaction => interaction.startupId.toString() === startupId && 
        interaction.actionType === 'viewed' && 
        new Date() - interaction.date < 24 * 60 * 60 * 1000
      );

      if (!existingView) {
        investor.startupInteractions.push({
          startupId,
          actionType: 'viewed'
        });
        await investor.save();

        if (!startup.investorActivity) startup.investorActivity = [];
        startup.investorActivity.push({
          investorId: investor._id,
          investorName: investor.investorName,
          investorType: investor.investorType,
          activityType: 'viewed',
          date: new Date()
        });
        await startup.save();
      }
    }

    const startupDetails = {
      overview: {
        _id: startup._id,
        companyName: startup.companyName,
        logoUrl: startup.logoUrl,
        website: startup.website,
        oneLineDescription: startup.oneLineDescription,
        industry: startup.industry,
        stage: startup.stage,
        pitch: startup.pitch || {}
      },
      funding: {
        currentRound: startup.fundingAsk || {},
        fundraisingSummary: startup.fundraisingSummary || {}
      },
      traction: {
        metrics: startup.metrics || {},
        keyTractionPoints: startup.marketInfo?.keyTractionPoints || 'No traction data available',
        fundraisingHistory: startup.fundraisingEntries || []
      },
      market: {
        marketSize: startup.marketInfo?.marketSize || 'Market size not specified',
        industry: startup.industry,
        stage: startup.stage
      },
      team: {
        founder: {
          name: startup.userId?.username || 'Founder',
          phone: startup.userId?.phone
        },
        teamSize: startup.metrics?.teamSize || 1
      },
      documents: startup.documents || [],
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

    const existingRequest = investor.introRequests.find(
      req => req.startupId.toString() === startupId && 
      (req.status === 'pending' || req.status === 'approved' || req.status === 'meeting-scheduled')
    );

    if (existingRequest) {
      return error(res, 'Introduction already requested', 400);
    }

    investor.introRequests.push({
      startupId,
      status: 'pending',
      notes: notes || `${investor.investorName} is interested in learning more about ${startup.companyName}`,
      requestDate: new Date()
    });

    investor.startupInteractions.push({
      startupId,
      actionType: 'intro-requested',
      date: new Date(),
      notes: notes || 'Requested introduction'
    });

    await investor.save();

    if (!startup.investorActivity) startup.investorActivity = [];
    startup.investorActivity.push({
      investorId: investor._id,
      investorName: investor.investorName,
      investorType: investor.investorType,
      activityType: 'intro-requested',
      date: new Date(),
      notes: notes || 'Requested introduction'
    });

    await startup.save();

    success(res, 'Introduction requested successfully', {
      startupName: startup.companyName,
      investorName: investor.investorName
    });
  } catch (err) {
    console.error('Request introduction error:', err);
    error(res, err.message, 400);
  }
};

// Get Profile
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

// Update Profile
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const updates = req.body;

    let investor = await Investor.findOne({ userId });
    
    if (!investor) {
      investor = new Investor({
        userId,
        investorName: updates.investorName || req.user.username,
        investorType: updates.investorType || 'individual',
        ...updates
      });
    } else {
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
  updateProfile,
  convertCommitmentToInvestment,
  withdrawCommitment
};
