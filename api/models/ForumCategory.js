const mongoose = require('mongoose');
const { Schema } = mongoose;

const forumCategorySchema = new Schema(
  {
    _id: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    color: {
      type: String,
      default: '#6B7280', // Gray color
    },
    icon: {
      type: String,
      trim: true,
    },
    order: {
      type: Number,
      default: 0,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    postCount: {
      type: Number,
      default: 0,
    },
    deletedAt: { 
      type: Date, 
      default: null,
      index: true,
    },
    deletedBy: { 
      type: Schema.Types.ObjectId, 
      ref: 'User' 
    },
  },
  {
    timestamps: true,
    _id: false, // Disable auto _id since we're providing custom string IDs
  }
);

// Indexes
forumCategorySchema.index({ deletedAt: 1, isActive: 1, order: 1 });

// Soft delete methods
forumCategorySchema.methods.softDelete = function(userId) {
  this.deletedAt = new Date();
  this.deletedBy = userId;
  return this.save();
};

forumCategorySchema.methods.restore = function() {
  this.deletedAt = null;
  this.deletedBy = null;
  return this.save();
};

// Query helper for non-deleted items
forumCategorySchema.query.notDeleted = function() {
  return this.where({ deletedAt: null });
};

const ForumCategory = mongoose.models.ForumCategory || mongoose.model('ForumCategory', forumCategorySchema);

module.exports = ForumCategory;