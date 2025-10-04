const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  senderType: {
    type: String,
    enum: ['investor', 'startup', 'incubator'],
    required: true
  },
  message: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  isRead: {
    type: Boolean,
    default: false
  }
});

const chatSchema = new mongoose.Schema({
  // Participants
  investorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Investor'
  },
  startupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Startup'
  },
  incubatorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Incubator'
  },
  
  // Chat type to identify conversation type
  chatType: {
    type: String,
    enum: ['investor-startup', 'startup-incubator'],
    required: true
  },
  
  messages: [messageSchema],
  lastMessage: {
    type: String
  },
  lastMessageDate: {
    type: Date,
    default: Date.now
  },
  unreadCount: {
    investor: { type: Number, default: 0 },
    startup: { type: Number, default: 0 },
    incubator: { type: Number, default: 0 }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

// Indexes for faster queries
chatSchema.index({ investorId: 1, startupId: 1 });
chatSchema.index({ startupId: 1, incubatorId: 1 });
chatSchema.index({ 'messages.timestamp': -1 });
chatSchema.index({ chatType: 1 });

module.exports = mongoose.model('Chat', chatSchema);
