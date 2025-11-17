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
  oneLineDescription: String, // ✅ Made optional since bulk import might not have it
  
  industry: {
    type: String,
    enum: [
      'Technology', 'Healthcare', 'Finance', 'Education', 'E-commerce',
      'Real Estate', 'Entertainment', 'Transportation', 'Energy',
      'Agriculture', 'Manufacturing', 'Other', 'Not specified' // ✅ Added for bulk import
    ],
    default: 'Not specified' // ✅ Added default
  },
  
  stage: {
    type: String,
    enum: ['idea', 'mvp', 'early-revenue', 'growth', 'scale'],
    default: 'idea' // ✅ Added default
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
      maxlength: 300
    }
  },
  
  // The Ask
  fundingAsk: {
    amount: {
      type: Number,
      // ✅ Removed enum to allow any amount from bulk import
      default: 0
    },
    timeline: {
      type: String,
      enum: ['Immediate', '1-3 months', '3-6 months', '6+ months', 'Not specified'],
      default: 'Not specified'
    },
    useOfFunds: String
  },
  
  // Key Numbers
  metrics: {
    monthlyRevenue: { type: Number, default: 0 },
    growthRate: String,
    customerCount: { type: Number, default: 0 },
    teamSize: { type: Number, default: 0 }
  },
  
  // Market & Traction
  marketInfo: {
    marketSize: String,
    keyTractionPoints: String
  },
  
  // Fundraising Tracker
  fundraisingTracker: {
    totalTarget: { type: Number, default: 0 },
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
  
  // ✅ Bulk Import Fields
  verifiedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Incubator'
  }],
  importedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Incubator'
  },
  importedAt: Date,
  
  // ✅ Additional fields for bulk import
  email: String,
  phone: String,
  founders: String,
  location: String,
  description: String,
  activated: { type: Boolean, default: false },
activationToken: String,
activationTokenExpiry: Date,
tempPassword: String,
lastLoginAt: Date,
  
  isPublic: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Startup', startupSchema);
