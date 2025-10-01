const Incubator = require('../models/Incubator');
const Application = require('../models/Application');
const Mentor = require('../models/Mentor');
const Startup = require('../models/Startup');
const Investor = require('../models/Investor');
const { success, error } = require('../utils/response');

// Get Incubator Dashboard Overview
// Get Incubator Dashboard Overview (with better debugging)
const getDashboard = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('Looking for incubator with userId:', userId);
    
    let incubator = await Incubator.findOne({ userId });
    console.log('Found incubator:', incubator);
    
    if (!incubator) {
      // Show debug info
      const allIncubators = await Incubator.find({});
      console.log('All incubators in DB:', allIncubators.map(inc => ({ 
        _id: inc._id, 
        userId: inc.userId, 
        name: inc.incubatorName 
      })));
      
      return error(res, `Incubator profile not found. Your userId: ${userId}. Please create profile first.`, 404);
    }

    // Rest of dashboard code...
    const dashboardData = {
      incubatorInfo: {
        incubatorName: incubator.incubatorName,
        logoUrl: incubator.logoUrl
      },
      overview: {
        activeStartups: 0,
        activeMentors: 0,
        totalFundingAsk: 0,
        totalUsers: 0,
        recentActivity: []
      }
    };

    success(res, 'Incubator dashboard retrieved successfully', dashboardData);
  } catch (err) {
    console.error('Incubator dashboard error:', err);
    error(res, err.message, 500);
  }
};

// Get Pending Mentors
const getPendingMentors = async (req, res) => {
  try {
    const mentors = await Mentor.find({
      status: 'pending'
    }).populate('userId', 'username phone');

    const formattedMentors = mentors.map(mentor => ({
      _id: mentor._id,
      mentorName: mentor.mentorName,
      expertise: mentor.expertise.join(', '),
      experience: mentor.experience,
      previousCompanies: mentor.previousCompanies.join(', '),
      linkedinUrl: mentor.linkedinUrl,
      appliedDate: mentor.createdAt,
      contactInfo: {
        username: mentor.userId?.username,
        phone: mentor.userId?.phone
      }
    }));

    success(res, 'Pending mentors retrieved successfully', {
      total: formattedMentors.length,
      mentors: formattedMentors
    });
  } catch (err) {
    error(res, err.message, 500);
  }
};

// Approve/Reject Mentor (Simplified)
const reviewMentor = async (req, res) => {
  try {
    const { mentorId } = req.params;
    const { action, reviewNotes } = req.body; // action: 'approve' or 'reject'
    const userId = req.user.id;

    if (!['approve', 'reject'].includes(action)) {
      return error(res, 'Invalid action. Use: approve or reject', 400);
    }

    const mentor = await Mentor.findById(mentorId);
    if (!mentor) {
      return error(res, 'Mentor not found', 404);
    }

    mentor.status = action === 'approve' ? 'approved' : 'rejected';
    mentor.reviewedAt = new Date();
    mentor.reviewedBy = userId;
    mentor.reviewNotes = reviewNotes;

    await mentor.save();

    success(res, `Mentor ${action}d successfully`, {
      mentorId,
      mentorName: mentor.mentorName,
      newStatus: mentor.status
    });
  } catch (err) {
    error(res, err.message, 400);
  }
};

const getApplications = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status } = req.query;
    
    const incubator = await Incubator.findOne({ userId });
    if (!incubator) {
      return error(res, 'Incubator profile not found', 404);
    }

    let query = { incubatorId: incubator._id };
    if (status) {
      query.status = status;
    }

    const applications = await Application.find(query)
      .populate({
        path: 'startupId',
        select: 'companyName logoUrl industry stage fundingAsk metrics marketInfo userId',
        populate: {
          path: 'userId',
          select: 'username phone'
        }
      })
      .sort({ createdAt: -1 });

    const formattedApplications = applications.map(app => ({
      _id: app._id,
      startup: {
        _id: app.startupId?._id,
        companyName: app.startupId?.companyName,
        logoUrl: app.startupId?.logoUrl,
        industry: app.startupId?.industry,
        stage: app.startupId?.stage,
        oneLineDescription: app.startupId?.oneLineDescription,
        fundingAsk: app.startupId?.fundingAsk,
        metrics: app.startupId?.metrics,
        keyTractionPoints: app.startupId?.marketInfo?.keyTractionPoints,
        founder: {
          username: app.startupId?.userId?.username,
          phone: app.startupId?.userId?.phone
        }
      },
      applicationData: app.applicationData,
      status: app.status,
      appliedDate: app.funnelTimestamps.appliedAt,
      reviewInfo: app.reviewInfo,
      daysSinceApplication: Math.floor((new Date() - app.funnelTimestamps.appliedAt) / (1000 * 60 * 60 * 24))
    }));

    success(res, 'Applications retrieved successfully', {
      total: formattedApplications.length,
      applications: formattedApplications
    });
  } catch (err) {
    error(res, err.message, 500);
  }
};

// Review Startup Application (Enhanced)
const reviewApplication = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { action, reviewNotes } = req.body;
    const userId = req.user.id;

    // Only 3 simple actions: view, accept, reject
    if (!['view', 'accept', 'reject'].includes(action)) {
      return error(res, 'Invalid action. Use: view, accept, or reject', 400);
    }

    const application = await Application.findById(applicationId)
      .populate('startupId', 'companyName')
      .populate('incubatorId', 'incubatorName');

    if (!application) {
      return error(res, 'Application not found', 404);
    }

    // Verify incubator ownership
    const incubator = await Incubator.findOne({ userId });
    if (!incubator || application.incubatorId._id.toString() !== incubator._id.toString()) {
      return error(res, 'Access denied', 403);
    }

    // Update status and timestamps
    const statusMapping = {
      'view': 'viewed',
      'accept': 'closed-deal',
      'reject': 'rejected'
    };

    const newStatus = statusMapping[action];
    application.status = newStatus;

    // Update timestamps
    if (action === 'view') {
      application.funnelTimestamps.viewedAt = new Date();
    } else if (action === 'accept') {
      application.funnelTimestamps.closedDealAt = new Date();
    } else if (action === 'reject') {
      application.funnelTimestamps.rejectedAt = new Date();
    }

    // Simple review info
    application.reviewInfo = {
      reviewedBy: userId,
      reviewDate: new Date(),
      reviewNotes: reviewNotes || `Application ${action}ed`
    };

    await application.save();

    // Update incubator stats
    if (action === 'accept') {
      incubator.stats.activeStartups += 1;
      incubator.stats.totalStartups += 1;
      await incubator.save();
    }

    success(res, `Application ${action}ed successfully`, {
      applicationId,
      startupName: application.startupId?.companyName,
      newStatus,
      action
    });
  } catch (err) {
    error(res, err.message, 400);
  }
};

// Get Applications by Status (Quick filters)
const getApplicationsByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    const userId = req.user.id;

    // Only allow simple statuses
    const allowedStatuses = ['applied', 'viewed', 'closed-deal', 'rejected'];
    if (!allowedStatuses.includes(status)) {
      return error(res, `Invalid status. Use: ${allowedStatuses.join(', ')}`, 400);
    }

    const incubator = await Incubator.findOne({ userId });
    if (!incubator) {
      return error(res, 'Incubator profile not found', 404);
    }

    const applications = await Application.find({
      incubatorId: incubator._id,
      status
    })
    .populate('startupId', 'companyName logoUrl industry stage fundingAsk')
    .sort({ createdAt: -1 });

    const formattedApplications = applications.map(app => ({
      _id: app._id,
      companyName: app.startupId?.companyName,
      logoUrl: app.startupId?.logoUrl,
      industry: app.startupId?.industry,
      stage: app.startupId?.stage,
      fundingAsk: app.startupId?.fundingAsk?.amount,
      appliedDate: app.funnelTimestamps.appliedAt,
      reviewedDate: app.reviewInfo?.reviewDate,
      daysSince: Math.floor((new Date() - app.funnelTimestamps.appliedAt) / (1000 * 60 * 60 * 24))
    }));

    success(res, `${status} applications retrieved successfully`, {
      status,
      total: formattedApplications.length,
      applications: formattedApplications
    });
  } catch (err) {
    error(res, err.message, 500);
  }
};
// Get Funnel Analytics
const getFunnelAnalytics = async (req, res) => {
  try {
    const userId = req.user.id;
    const incubator = await Incubator.findOne({ userId });
    
    if (!incubator) {
      return error(res, 'Incubator profile not found', 404);
    }

    // Get funnel counts for simplified flow
    const funnelData = await Application.aggregate([
      { $match: { incubatorId: incubator._id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Initialize simplified funnel
    const funnel = {
      applied: 0,
      viewed: 0,
      'closed-deal': 0,
      rejected: 0
    };

    // Fill in actual counts
    funnelData.forEach(item => {
      if (funnel.hasOwnProperty(item._id)) {
        funnel[item._id] = item.count;
      }
    });

    // Calculate conversion rates for simplified flow
    const conversionRates = {
      'applicationToView': funnel.applied > 0 ? Math.round((funnel.viewed / funnel.applied) * 100) : 0,
      'viewToAccept': funnel.viewed > 0 ? Math.round((funnel['closed-deal'] / funnel.viewed) * 100) : 0,
      'overallConversion': funnel.applied > 0 ? Math.round((funnel['closed-deal'] / funnel.applied) * 100) : 0
    };

    const analyticsData = {
      funnel: {
        applied: funnel.applied,
        viewed: funnel.viewed,
        closedDeals: funnel['closed-deal'],
        rejected: funnel.rejected
      },
      conversionRates: {
        applicationToView: conversionRates.applicationToView,
        viewToAccept: conversionRates.viewToAccept,
        overallSuccess: conversionRates.overallConversion
      },
      insights: {
        totalApplications: funnel.applied,
        successRate: conversionRates.overallConversion,
        pendingReview: funnel.applied - funnel.viewed - funnel['closed-deal'] - funnel.rejected
      }
    };

    success(res, 'Simplified funnel analytics retrieved successfully', analyticsData);
  } catch (err) {
    error(res, err.message, 500);
  }
};

// Get/Update Incubator Profile
const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const incubator = await Incubator.findOne({ userId });

    if (!incubator) {
      return error(res, 'Incubator profile not found', 404);
    }

    success(res, 'Incubator profile retrieved successfully', incubator);
  } catch (err) {
    error(res, err.message, 500);
  }
};

const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const updates = req.body;

    let incubator = await Incubator.findOne({ userId });
    
    if (!incubator) {
      // Create new incubator profile
      incubator = new Incubator({
        userId,
        incubatorName: updates.incubatorName || req.user.username,
        ...updates
      });
    } else {
      // Update existing profile
      Object.keys(updates).forEach(key => {
        if (updates[key] !== undefined) {
          incubator[key] = updates[key];
        }
      });
    }

    await incubator.save();
    success(res, 'Incubator profile updated successfully', incubator);
  } catch (err) {
    error(res, err.message, 400);
  }
};

module.exports = {
  getDashboard,
  getPendingMentors,
  reviewMentor,
  getApplications,
   getApplicationsByStatus,
  reviewApplication,
  getFunnelAnalytics,
  getProfile,
  updateProfile
};
