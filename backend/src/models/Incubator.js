const mongoose = require('mongoose');

const incubatorSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Incubator Profile
  incubatorName: { type: String, required: true },
  description: String,
  website: String,
  logoUrl: String,
  location: String,
  foundedYear: Number,
  
  // Program Details
  programDetails: {
    duration: String, // "3 months", "6 months"
    batchSize: Number,
    equityTaken: Number, // Percentage
    investmentAmount: Number,
    industries: [String],
    stages: [String]
  },
  
  // Active Programs
  currentBatch: {
    batchNumber: Number,
    startDate: Date,
    endDate: Date,
    theme: String
  },
  
  // Statistics
  stats: {
    totalStartups: { type: Number, default: 0 },
    activeStartups: { type: Number, default: 0 },
    totalMentors: { type: Number, default: 0 },
    activeMentors: { type: Number, default: 0 },
    totalFundingFacilitated: { type: Number, default: 0 },
    successfulExits: { type: Number, default: 0 }
  },
  
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Incubator', incubatorSchema);
