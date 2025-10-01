const mongoose = require('mongoose');

const startupSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Company Details
  companyName: { type: String, required: true },
  website: String,
  logoUrl: String,
  oneLineDescription: { type: String, required: true },
  
  industry: {
    type: String,
    enum: [
      'Technology', 'Healthcare', 'Finance', 'Education', 'E-commerce',
      'Real Estate', 'Entertainment', 'Transportation', 'Energy',
      'Agriculture', 'Manufacturing', 'Other'
    ],
    required: true
  },
  
  stage: {
    type: String,
    enum: ['idea', 'mvp', 'early-revenue', 'growth', 'scale'],
    required: true
  },
  
  // 60-Second Pitch
  pitch: {
    videoUrl: {
      type: String,
      validate: {
        validator: function(v) {
          return !v || /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be|vimeo\.com|loom\.com)/.test(v);
        },
        message: 'Please provide a valid YouTube, Vimeo, or Loom URL'
      }
    },
    writtenPitch: {
      type: String,
      maxlength: 300 // 2-3 sentences max
    }
  },
  
  // The Ask
  fundingAsk: {
    amount: {
      type: Number,
      enum: [2500000, 5000000, 10000000, 20000000, 50000000, 100000000],
      required: true
    },
    timeline: {
      type: String,
      enum: ['Immediate', '1-3 months', '3-6 months', '6+ months'],
      required: true
    },
    useOfFunds: { type: String, required: true }
  },
  
  // Key Numbers
  metrics: {
    monthlyRevenue: Number,
    growthRate: String,
    customerCount: Number,
    teamSize: Number
  },
  
  // Market & Traction
  marketInfo: {
    marketSize: String,
    keyTractionPoints: { type: String, required: true }
  },
  
  // Fundraising Tracker
  fundraisingTracker: {
    totalTarget: Number,
    totalRaised: { type: Number, default: 0 },
    totalCommitted: { type: Number, default: 0 },
    investorsCount: { type: Number, default: 0 },
    lastUpdated: { type: Date, default: Date.now }
  },
  
  // Investor Activity
  investorActivity: [{
    investorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    investorName: String,
    activityType: {
      type: String,
      enum: ['viewed', 'interested', 'meeting-requested', 'meeting-completed', 'invested', 'passed']
    },
    amount: Number,
    equity: Number,
    date: { type: Date, default: Date.now },
    notes: String
  }],
  
  // Tasks
  tasks: [{
    title: { type: String, required: true },
    description: String,
    status: {
      type: String,
      enum: ['pending', 'in-progress', 'completed'],
      default: 'pending'
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    },
    dueDate: Date,
    completedDate: Date,
    createdBy: String
  }],
  
  isPublic: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Startup', startupSchema);
