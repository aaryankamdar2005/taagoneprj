const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  startupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Startup',
    required: true
  },
  
  incubatorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Incubator',
    required: true
  },
  
  // Application Details
  applicationData: {
    whyJoinProgram: String,
    expectedOutcomes: String,
    currentChallenges: String,
    fundingNeeds: Number,
    timeCommitment: String
  },
  
  // Application Status & Funnel Tracking
  status: {
    type: String,
    enum: ['applied', 'viewed', 'shortlisted', 'intro-requested', 'closed-deal', 'rejected'],
    default: 'applied'
  },
  
  // Funnel Timestamps
  funnelTimestamps: {
    appliedAt: { type: Date, default: Date.now },
    viewedAt: Date,
    shortlistedAt: Date,
    introRequestedAt: Date,
    closedDealAt: Date,
    rejectedAt: Date
  },
  
  // Review Information
  reviewInfo: {
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewDate: Date,
    reviewNotes: String,
    score: Number, // 1-10 rating
    strengths: [String],
    concerns: [String]
  },
  
  // Investor Matching
  matchedInvestors: [{
    investorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Investor' },
    matchScore: Number,
    introStatus: {
      type: String,
      enum: ['suggested', 'intro-sent', 'meeting-scheduled', 'completed'],
      default: 'suggested'
    },
    introDate: Date
  }],
  
  // Program Assignment
  assignedBatch: {
    batchNumber: Number,
    startDate: Date,
    mentor: { type: mongoose.Schema.Types.ObjectId, ref: 'Mentor' }
  }
}, { timestamps: true });

module.exports = mongoose.model('Application', applicationSchema);
