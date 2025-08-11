const mongoose = require('mongoose');

const directConversationSchema = new mongoose.Schema({
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  lastMessage: {
    content: {
      type: String,
      maxlength: 500
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  unreadCount: {
    type: Map,
    of: Number,
    default: new Map()
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Ensure exactly 2 participants
directConversationSchema.pre('save', function(next) {
  if (this.participants.length !== 2) {
    return next(new Error('Direct conversations must have exactly 2 participants'));
  }
  
  // Initialize unread counts for both participants if not set
  if (!this.unreadCount || this.unreadCount.size === 0) {
    this.unreadCount = new Map();
    this.participants.forEach(participant => {
      this.unreadCount.set(participant.toString(), 0);
    });
  }
  
  next();
});

// Index for finding conversations between two users
directConversationSchema.index({ participants: 1 });
directConversationSchema.index({ 'lastMessage.timestamp': -1 });
directConversationSchema.index({ updatedAt: -1 });

// Static method to find or create conversation between two users
directConversationSchema.statics.findOrCreate = async function(userId1, userId2) {
  // Sort user IDs to ensure consistent ordering
  const participants = [userId1, userId2].sort();
  
  let conversation = await this.findOne({
    participants: { $all: participants }
  });
  
  if (!conversation) {
    conversation = await this.create({
      participants,
      unreadCount: new Map([
        [userId1.toString(), 0],
        [userId2.toString(), 0]
      ])
    });
  }
  
  return conversation;
};

module.exports = mongoose.models.DirectConversation || mongoose.model('DirectConversation', directConversationSchema);