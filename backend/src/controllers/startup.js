const Startup = require('../models/Startup');
const Application = require('../models/Application'); 
const { success, error } = require('../utils/response');

// Get Dashboard Data
const getDashboard = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const startup = await Startup.findOne({ userId });
    
    if (!startup) {
      return error(res, 'Startup profile not found', 404);
    }

    const dashboardData = {
      companyInfo: {
        companyName: startup.companyName,
        logoUrl: startup.logoUrl,
        stage: startup.stage,
        industry: startup.industry
      },
      fundraisingTracker: startup.fundraisingTracker || {
        totalTarget: 0,
        totalRaised: 0,
        progressPercentage: 0
      },
      investorActivity: startup.investorActivity || [],
      tasks: startup.tasks?.filter(task => task.status !== 'completed') || [],
      recentMetrics: startup.metrics || {}
    };

    success(res, 'Dashboard data retrieved successfully', dashboardData);
  } catch (err) {
    error(res, err.message, 500);
  }
};

// Update Investor Pitch
const updateInvestorPitch = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const {
      videoUrl,
      writtenPitch,
      companyName,
      website,
      oneLineDescription,
      fundingAmount,
      timeline,
      useOfFunds,
      monthlyRevenue,
      growthRate,
      customerCount,
      teamSize,
      marketSize,
      keyTractionPoints
    } = req.body;

    let startup = await Startup.findOne({ userId });
    
    if (!startup) {
      // Create new startup profile
      startup = new Startup({
        userId,
        companyName: companyName || 'My Startup',
        oneLineDescription: oneLineDescription || 'Building something amazing',
        industry: 'Technology',
        stage: 'idea'
      });
    }

    // Update pitch
    if (!startup.pitch) startup.pitch = {};
    if (videoUrl !== undefined) startup.pitch.videoUrl = videoUrl;
    if (writtenPitch !== undefined) startup.pitch.writtenPitch = writtenPitch;

    // Update company details
    if (companyName !== undefined) startup.companyName = companyName;
    if (website !== undefined) startup.website = website;
    if (oneLineDescription !== undefined) startup.oneLineDescription = oneLineDescription;

    // Update funding ask
    if (!startup.fundingAsk) startup.fundingAsk = {};
    if (fundingAmount !== undefined) startup.fundingAsk.amount = fundingAmount;
    if (timeline !== undefined) startup.fundingAsk.timeline = timeline;
    if (useOfFunds !== undefined) startup.fundingAsk.useOfFunds = useOfFunds;

    // Update metrics
    if (!startup.metrics) startup.metrics = {};
    if (monthlyRevenue !== undefined) startup.metrics.monthlyRevenue = monthlyRevenue;
    if (growthRate !== undefined) startup.metrics.growthRate = growthRate;
    if (customerCount !== undefined) startup.metrics.customerCount = customerCount;
    if (teamSize !== undefined) startup.metrics.teamSize = teamSize;

    // Update market info
    if (!startup.marketInfo) startup.marketInfo = {};
    if (marketSize !== undefined) startup.marketInfo.marketSize = marketSize;
    if (keyTractionPoints !== undefined) startup.marketInfo.keyTractionPoints = keyTractionPoints;

    await startup.save();

    success(res, 'Investor pitch updated successfully', startup);
  } catch (err) {
    error(res, err.message, 400);
  }
};

// Get Investor Pitch Details
const getInvestorPitch = async (req, res) => {
  try {
    const userId = req.user.id;
    const startup = await Startup.findOne({ userId });
    
    if (!startup) {
      return error(res, 'Startup profile not found', 404);
    }

    success(res, 'Investor pitch details retrieved', startup);
  } catch (err) {
    error(res, err.message, 500);
  }
};

// Add Task
const addTask = async (req, res) => {
  try {
    const userId = req.user.id;
    const { title, description, priority, dueDate } = req.body;

    const startup = await Startup.findOne({ userId });
    if (!startup) {
      return error(res, 'Startup profile not found', 404);
    }

    if (!startup.tasks) startup.tasks = [];
    
    startup.tasks.push({
      title,
      description,
      priority: priority || 'medium',
      dueDate: dueDate ? new Date(dueDate) : null,
      createdBy: 'self'
    });

    await startup.save();
    success(res, 'Task added successfully', startup.tasks[startup.tasks.length - 1]);
  } catch (err) {
    error(res, err.message, 400);
  }
};

// Update Task Status
const updateTask = async (req, res) => {
  try {
    const userId = req.user.id;
    const { taskId } = req.params;
    const { status } = req.body;

    const startup = await Startup.findOne({ userId });
    if (!startup) {
      return error(res, 'Startup profile not found', 404);
    }

    const task = startup.tasks.id(taskId);
    if (!task) {
      return error(res, 'Task not found', 404);
    }

    task.status = status;
    if (status === 'completed') {
      task.completedDate = new Date();
    }

    await startup.save();
    success(res, 'Task updated successfully', task);
  } catch (err) {
    error(res, err.message, 400);
  }
};

// ... (keep existing methods)

// Get All Intro Requests
const getIntroRequests = async (req, res) => {
  try {
    const userId = req.user.id;
    const startup = await Startup.findOne({ userId });
    
    if (!startup) {
      return error(res, 'Startup profile not found', 404);
    }

    // Get intro requests from investors
    const Investor = require('../models/Investor');
    const introRequests = await Investor.find({
      'introRequests.startupId': startup._id
    })
    .populate('userId', 'username phone')
    .select('investorName investorType introRequests userId');

    // Flatten and filter intro requests for this startup
    const formattedRequests = [];
    introRequests.forEach(investor => {
      const relevantRequests = investor.introRequests.filter(
        req => req.startupId.toString() === startup._id.toString()
      );
      
      relevantRequests.forEach(request => {
        formattedRequests.push({
          _id: request._id,
          investorId: investor._id,
          investorName: investor.investorName,
          investorType: investor.investorType,
          investorUsername: investor.userId?.username,
          investorPhone: investor.userId?.phone,
          status: request.status,
          requestDate: request.requestDate,
          notes: request.notes,
          meetingDate: request.meetingDate
        });
      });
    });

    // Sort by most recent
    formattedRequests.sort((a, b) => new Date(b.requestDate) - new Date(a.requestDate));

    success(res, 'Intro requests retrieved successfully', {
      total: formattedRequests.length,
      requests: formattedRequests
    });
  } catch (err) {
    error(res, err.message, 500);
  }
};

// Respond to Intro Request
const respondToIntroRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status, meetingDate, responseNotes } = req.body;
    const userId = req.user.id;

    // Validate status
    if (!['approved', 'declined', 'meeting-scheduled'].includes(status)) {
      return error(res, 'Invalid status. Use: approved, declined, meeting-scheduled', 400);
    }

    const startup = await Startup.findOne({ userId });
    if (!startup) {
      return error(res, 'Startup profile not found', 404);
    }

    // Find the investor with this intro request
    const Investor = require('../models/Investor');
    const investor = await Investor.findOne({
      'introRequests._id': requestId
    });

    if (!investor) {
      return error(res, 'Intro request not found', 404);
    }

    // Update the intro request
    const introRequest = investor.introRequests.id(requestId);
    if (!introRequest) {
      return error(res, 'Intro request not found', 404);
    }

    introRequest.status = status;
    if (meetingDate) {
      introRequest.meetingDate = new Date(meetingDate);
    }
    if (responseNotes) {
      introRequest.notes = `${introRequest.notes}\n\nStartup Response: ${responseNotes}`;
    }

    await investor.save();

    // Track activity on startup side
    if (!startup.investorActivity) startup.investorActivity = [];
    startup.investorActivity.push({
      investorId: investor._id,
      investorName: investor.investorName,
      activityType: status === 'approved' ? 'meeting-requested' : 'passed',
      notes: `Intro request ${status}${meetingDate ? ` - Meeting scheduled for ${new Date(meetingDate).toLocaleDateString()}` : ''}`
    });

    await startup.save();

    // Track activity on investor side
    investor.startupInteractions.push({
      startupId: startup._id,
      actionType: status === 'approved' ? 'meeting-scheduled' : 'passed',
      notes: `Startup ${status} intro request${meetingDate ? ` - Meeting: ${new Date(meetingDate).toLocaleDateString()}` : ''}`
    });

    await investor.save();

    success(res, `Intro request ${status} successfully`, {
      requestId,
      status,
      investorName: investor.investorName,
      meetingDate
    });
  } catch (err) {
    error(res, err.message, 400);
  }
};

// Get All Soft Commitments
const getSoftCommitments = async (req, res) => {
  try {
    const userId = req.user.id;
    const startup = await Startup.findOne({ userId });
    
    if (!startup) {
      return error(res, 'Startup profile not found', 404);
    }

    // Get soft commitments from investors
    const Investor = require('../models/Investor');
    const softCommitments = await Investor.find({
      'softCommitments.startupId': startup._id
    })
    .populate('userId', 'username phone')
    .select('investorName investorType softCommitments userId investmentCapacity');

    // Flatten and filter soft commitments for this startup
    const formattedCommitments = [];
    softCommitments.forEach(investor => {
      const relevantCommitments = investor.softCommitments.filter(
        commit => commit.startupId.toString() === startup._id.toString()
      );
      
      relevantCommitments.forEach(commitment => {
        formattedCommitments.push({
          _id: commitment._id,
          investorId: investor._id,
          investorName: investor.investorName,
          investorType: investor.investorType,
          investorUsername: investor.userId?.username,
          investorPhone: investor.userId?.phone,
          amount: commitment.amount,
          equityExpected: commitment.equityExpected,
          conditions: commitment.conditions,
          status: commitment.status,
          commitDate: commitment.commitDate,
          expiryDate: commitment.expiryDate,
          daysRemaining: Math.ceil((new Date(commitment.expiryDate) - new Date()) / (1000 * 60 * 60 * 24))
        });
      });
    });

    // Sort by amount (highest first)
    formattedCommitments.sort((a, b) => b.amount - a.amount);

    // Calculate totals
    const totalCommitted = formattedCommitments
      .filter(c => c.status === 'active')
      .reduce((sum, c) => sum + c.amount, 0);

    success(res, 'Soft commitments retrieved successfully', {
      total: formattedCommitments.length,
      totalCommitted,
      commitments: formattedCommitments
    });
  } catch (err) {
    error(res, err.message, 500);
  }
};

// Respond to Soft Commitment
const respondToSoftCommitment = async (req, res) => {
  try {
    const { commitmentId } = req.params;
    const { action, counterOffer, responseNotes } = req.body;
    const userId = req.user.id;

    // Validate action
    if (!['accept', 'counter', 'decline'].includes(action)) {
      return error(res, 'Invalid action. Use: accept, counter, decline', 400);
    }

    const startup = await Startup.findOne({ userId });
    if (!startup) {
      return error(res, 'Startup profile not found', 404);
    }

    // Find the investor with this soft commitment
    const Investor = require('../models/Investor');
    const investor = await Investor.findOne({
      'softCommitments._id': commitmentId
    });

    if (!investor) {
      return error(res, 'Soft commitment not found', 404);
    }

    const softCommitment = investor.softCommitments.id(commitmentId);
    if (!softCommitment) {
      return error(res, 'Soft commitment not found', 404);
    }

    let responseMessage = '';
    let newStatus = softCommitment.status;

    if (action === 'accept') {
      // Move to formal investment process
      newStatus = 'converted';
      responseMessage = 'Soft commitment accepted! Moving to formal investment process.';

      // Add to startup's fundraising entries as committed
      if (!startup.fundraisingEntries) startup.fundraisingEntries = [];
      startup.fundraisingEntries.push({
        investorName: investor.investorName,
        investorId: investor.userId,
        amount: softCommitment.amount,
        equity: softCommitment.equityExpected || 0,
        roundType: 'seed', // Customize as needed
        status: 'committed',
        notes: `Converted from soft commitment. ${responseNotes || ''}`
      });

      // Update fundraising tracker
      if (!startup.fundraisingTracker) {
        startup.fundraisingTracker = {
          totalTarget: startup.fundingAsk?.amount || 0,
          totalRaised: 0,
          investorsCount: 0,
          lastUpdated: new Date()
        };
      }

      startup.fundraisingTracker.totalRaised += softCommitment.amount;

      // Increment investorsCount if this investor not counted before
      const existingInvestorEntry = startup.investorActivity.find(activity =>
        activity.investorId?.toString() === investor._id.toString() && activity.activityType === 'invested'
      );
      if (!existingInvestorEntry) {
        startup.fundraisingTracker.investorsCount += 1;
      }

      startup.fundraisingTracker.lastUpdated = new Date();

    } else if (action === 'counter') {
      responseMessage = 'Counter offer sent to investor.';
      // Keep status as active but add counter offer notes
      if (counterOffer) {
        softCommitment.conditions = `${softCommitment.conditions}\n\nStartup Counter: ${counterOffer}`;
      }

    } else if (action === 'decline') {
      newStatus = 'withdrawn';
      responseMessage = 'Soft commitment declined.';
    }

    softCommitment.status = newStatus;
    await investor.save();

    // Track activity on startup side
    if (!startup.investorActivity) startup.investorActivity = [];
    startup.investorActivity.push({
      investorId: investor._id,
      investorName: investor.investorName,
      activityType: action === 'accept' ? 'invested' : 'passed',
      amount: softCommitment.amount,
      notes: `Soft commitment ${action}ed. ${responseNotes || ''}`
    });

    await startup.save();

    // Track activity on investor side
    investor.startupInteractions.push({
      startupId: startup._id,
      actionType: action === 'accept' ? 'invested' : 'passed',
      amount: softCommitment.amount,
      notes: `Startup ${action}ed soft commitment${counterOffer ? ` with counter: ${counterOffer}` : ''}`
    });

    await investor.save();

    success(res, responseMessage, {
      commitmentId,
      action,
      amount: softCommitment.amount,
      investorName: investor.investorName,
      newStatus
    });
  } catch (err) {
    error(res, err.message, 400);
  }
};





// Apply to Incubator
const applyToIncubator = async (req, res) => {
  try {
    const userId = req.user.id;
    const { incubatorId } = req.params;
    const {
      whyJoinProgram,
      expectedOutcomes,
      currentChallenges,
      fundingNeeds,
      timeCommitment
    } = req.body;

    const startup = await Startup.findOne({ userId });
    if (!startup) {
      return error(res, 'Please complete your startup profile first', 404);
    }

    // Check if application already exists
    const existingApplication = await Application.findOne({
      startupId: startup._id,
      incubatorId
    });

    if (existingApplication) {
      return error(res, 'Application to this incubator already exists', 400);
    }

    // Verify incubator exists
    const Incubator = require('../models/Incubator');
    const incubator = await Incubator.findById(incubatorId);
    if (!incubator) {
      return error(res, 'Incubator not found', 404);
    }

    // Create application
    const application = new Application({
      startupId: startup._id,
      incubatorId,
      applicationData: {
        whyJoinProgram,
        expectedOutcomes,
        currentChallenges,
        fundingNeeds,
        timeCommitment
      }
    });

    await application.save();

    success(res, 'Application submitted successfully', {
      applicationId: application._id,
      incubatorName: incubator.incubatorName,
      status: application.status,
      appliedDate: application.funnelTimestamps.appliedAt
    });
  } catch (err) {
    error(res, err.message, 400);
  }
};

// Get Startup's Applications
const getMyApplications = async (req, res) => {
  try {
    const userId = req.user.id;
    const startup = await Startup.findOne({ userId });
    
    if (!startup) {
      return error(res, 'Startup profile not found', 404);
    }

    const applications = await Application.find({ startupId: startup._id })
      .populate('incubatorId', 'incubatorName logoUrl location')
      .sort({ createdAt: -1 });

    const formattedApplications = applications.map(app => ({
      _id: app._id,
      incubator: {
        name: app.incubatorId?.incubatorName,
        logoUrl: app.incubatorId?.logoUrl,
        location: app.incubatorId?.location
      },
      status: app.status,
      appliedDate: app.funnelTimestamps.appliedAt,
      reviewInfo: app.reviewInfo,
      applicationData: app.applicationData,
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

// Get Available Incubators
const getAvailableIncubators = async (req, res) => {
  try {
    const Incubator = require('../models/Incubator');
    const incubators = await Incubator.find({ isActive: true })
      .select('incubatorName description logoUrl location programDetails stats');

    const formattedIncubators = incubators.map(inc => ({
      _id: inc._id,
      incubatorName: inc.incubatorName,
      description: inc.description,
      logoUrl: inc.logoUrl,
      location: inc.location,
      programDetails: {
        duration: inc.programDetails?.duration,
        equityTaken: inc.programDetails?.equityTaken,
        investmentAmount: inc.programDetails?.investmentAmount,
        industries: inc.programDetails?.industries
      },
      stats: {
        activeStartups: inc.stats?.activeStartups || 0,
        activeMentors: inc.stats?.activeMentors || 0
      }
    }));

    success(res, 'Available incubators retrieved successfully', {
      total: formattedIncubators.length,
      incubators: formattedIncubators
    });
  } catch (err) {
    error(res, err.message, 500);
  }
};
// Export all methods (add new ones)
module.exports = {
  getDashboard,
  updateInvestorPitch,
  getInvestorPitch,
  addTask,
  updateTask,
  getMyApplications,
  getAvailableIncubators,
  applyToIncubator,
getIntroRequests,
  respondToIntroRequest,
  getSoftCommitments,
  respondToSoftCommitment
};


