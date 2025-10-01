const mongoose = require('mongoose');

const mentorSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Basic Mentor Info
  mentorName: { type: String, required: true },
  expertise: [String], // ["FinTech", "Product Strategy"]
  experience: String,  // "15 years"
  previousCompanies: [String], // ["Paytm", "Razorpay"]
  linkedinUrl: String,
  
  // Application Status
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  
  // Review Info
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: Date,
  reviewNotes: String
}, { timestamps: true });

module.exports = mongoose.model('Mentor', mentorSchema);
