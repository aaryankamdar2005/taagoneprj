const mongoose = require('mongoose');

const investorSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Investor Profile
  investorName: { type: String, required: true },
  investorType: {
    type: String,
    enum: ['angel', 'vc-fund', 'family-office', 'corporate', 'individual'],
    required: true
  },
  
  // Investment Preferences
  investmentPreferences: {
    industries: [{
      type: String,
      enum: ['Technology', 'Healthcare', 'Finance', 'Education', 'E-commerce', 'Real Estate', 'Entertainment', 'Transportation', 'Energy', 'Agriculture', 'Manufacturing', 'Other']
    }],
    stages: [{
      type: String,
      enum: ['idea', 'mvp', 'early-revenue', 'growth', 'scale']
    }],
    minInvestment: { type: Number, default: 1000000 }, // ₹10L
    maxInvestment: { type: Number, default: 50000000 }, // ₹5Cr
    geography: [String], // ['Mumbai', 'Bangalore', 'Delhi', 'Pan-India']
    riskProfile: {
      type: String,
      enum: ['conservative', 'moderate', 'aggressive'],
      default: 'moderate'
    }
  },
  
  // Investment Capacity
  investmentCapacity: {
    totalFundsAvailable: Number,
    currentlyInvested: { type: Number, default: 0 },
    availableFunds: Number,
    avgTicketSize: Number
  },
  
  // Track Investment Activity
  portfolioCompanies: [{
    startupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Startup' },
    investmentAmount: Number,
    equityPercentage: Number,
    investmentDate: Date,
    currentValuation: Number,
    status: {
      type: String,
      enum: ['active', 'exited', 'failed'],
      default: 'active'
    }
  }],
  
  // Investor Activity Tracking
  startupInteractions: [{
    startupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Startup' },
    actionType: {
      type: String,
      enum: ['viewed', 'saved', 'intro-requested', 'meeting-scheduled', 'soft-commit', 'invested', 'passed']
    },
    amount: Number, // For soft commits and investments
    date: { type: Date, default: Date.now },
    notes: String
  }],
  
  // Intro Requests
  introRequests: [{
    startupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Startup' },
    status: {
      type: String,
      enum: ['pending', 'approved', 'declined', 'meeting-scheduled', 'completed'],
      default: 'pending'
    },
    requestDate: { type: Date, default: Date.now },
    notes: String,
    meetingDate: Date
  }],
  
  // Soft Commitments
  softCommitments: [{
    startupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Startup' },
    amount: { type: Number, required: true },
    equityExpected: Number,
    conditions: String,
    expiryDate: Date,
    status: {
      type: String,
      enum: ['active', 'converted', 'expired', 'withdrawn'],
      default: 'active'
    },
    commitDate: { type: Date, default: Date.now }
  }],
  
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Investor', investorSchema);
