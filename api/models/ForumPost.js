const mongoose = require('mongoose');
const { Schema } = mongoose;

const forumPostSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 10000,
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    category: {
      type: String,
      index: true,
    },
    tags: [{
      type: String,
      trim: true,
      lowercase: true,
    }],
    views: {
      type: Number,
      default: 0,
    },
    likes: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
    }],
    likeCount: {
      type: Number,
      default: 0,
    },
    replyCount: {
      type: Number,
      default: 0,
    },
    lastReplyAt: {
      type: Date,
    },
    lastReplyBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    isPinned: {
      type: Boolean,
      default: false,
      index: true,
    },
    isLocked: {
      type: Boolean,
      default: false,
    },
    isFlagged: {
      type: Boolean,
      default: false,
    },
    editHistory: [{
      content: {
        type: String,
        required: true,
      },
      title: {
        type: String,
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

// Compound indexes for efficient querying
forumPostSchema.index({ category: 1, isPinned: -1, createdAt: -1 });
forumPostSchema.index({ category: 1, deletedAt: 1, lastReplyAt: -1 });
forumPostSchema.index({ author: 1, deletedAt: 1, createdAt: -1 });
forumPostSchema.index({ tags: 1 });
forumPostSchema.index({ deletedAt: 1 });

// Text index for search
forumPostSchema.index({ title: 'text', content: 'text' });

// Pre-hook to filter out soft deleted documents
forumPostSchema.pre(/^find/, function() {
  if (!this.getOptions().includeDeleted) {
    this.where({ deletedAt: null });
  }
});

// Update likeCount when likes array changes
forumPostSchema.pre('save', function(next) {
  if (this.isModified('likes')) {
    this.likeCount = this.likes.length;
  }
  next();
});

// Method to soft delete
forumPostSchema.methods.softDelete = async function(userId) {
  return await this.constructor.updateOne(
    { _id: this._id },
    { 
      $set: {
        deletedAt: new Date(),
        deletedBy: userId
      }
    }
  );
};

// Method to restore soft deleted item
forumPostSchema.methods.restore = function() {
  this.deletedAt = null;
  this.deletedBy = null;
  return this.save();
};

// Method to add edit history entry
forumPostSchema.methods.addEditHistory = function(userId, oldContent, oldTitle) {
  this.editHistory.push({
    content: oldContent,
    title: oldTitle,
    editedAt: new Date(),
    editedBy: userId,
  });
};

const ForumPost = mongoose.models.ForumPost || mongoose.model('ForumPost', forumPostSchema);

module.exports = ForumPost;