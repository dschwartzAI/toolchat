const mongoose = require('mongoose');

const directMessageSchema = new mongoose.Schema({
  conversationId: {
    type: String,
    required: true,
    index: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  content: {
    type: String,
    required: true,
    maxlength: 5000
  },
  isRead: {
    type: Boolean,
    default: false,
    index: true
  },
  editedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
directMessageSchema.index({ conversationId: 1, createdAt: -1 });
directMessageSchema.index({ sender: 1, recipient: 1 });
directMessageSchema.index({ recipient: 1, isRead: 1 });

module.exports = mongoose.models.DirectMessage || mongoose.model('DirectMessage', directMessageSchema);