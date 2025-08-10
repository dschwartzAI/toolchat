const mongoose = require('mongoose');
const { Schema } = mongoose;

const forumReplySchema = new Schema(
  {
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000,
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    post: {
      type: Schema.Types.ObjectId,
      ref: 'ForumPost',
      required: true,
      index: true,
    },
    parentReply: {
      type: Schema.Types.ObjectId,
      ref: 'ForumReply',
      default: null,
    },
    likes: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
    }],
    likeCount: {
      type: Number,
      default: 0,
    },
    isEdited: {
      type: Boolean,
      default: false,
    },
    editHistory: [{
      content: {
        type: String,
        required: true,
      },
      editedAt: {
        type: Date,
        required: true,
      },
      editedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
    }],
    deletedAt: {
      type: Date,
      default: null,
    },
    deletedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient querying
forumReplySchema.index({ post: 1, deletedAt: 1, createdAt: 1 });
forumReplySchema.index({ parentReply: 1, deletedAt: 1 });
forumReplySchema.index({ author: 1, deletedAt: 1 });

// Pre-hook to filter out soft deleted documents
// IMPORTANT: This applies to find, findOne, findById, etc.
forumReplySchema.pre(/^find/, function() {
  // Only filter if not explicitly including deleted items
  if (!this.getOptions().includeDeleted) {
    // Filter out documents where deletedAt exists and is not null
    this.where({ 
      $or: [
        { deletedAt: null },
        { deletedAt: { $exists: false } }
      ]
    });
  }
});

// Update likeCount when likes array changes
forumReplySchema.pre('save', function(next) {
  if (this.isModified('likes')) {
    this.likeCount = this.likes.length;
  }
  next();
});

// Method to soft delete
forumReplySchema.methods.softDelete = function(userId) {
  this.deletedAt = new Date();
  this.deletedBy = userId;
  return this.save();
};

// Method to restore soft deleted item
forumReplySchema.methods.restore = function() {
  this.deletedAt = null;
  this.deletedBy = null;
  return this.save();
};

// Method to add edit history entry
forumReplySchema.methods.addEditHistory = function(userId, oldContent) {
  this.editHistory.push({
    content: oldContent,
    editedAt: new Date(),
    editedBy: userId,
  });
  this.isEdited = true;
};

// Static method to find non-deleted replies
forumReplySchema.statics.findActive = function(conditions = {}) {
  return this.find({ ...conditions, deletedAt: null });
};

// Static method to find with deleted
forumReplySchema.statics.findWithDeleted = function(conditions = {}) {
  return this.find(conditions).setOptions({ includeDeleted: true });
};

const ForumReply = mongoose.models.ForumReply || mongoose.model('ForumReply', forumReplySchema);

module.exports = ForumReply;