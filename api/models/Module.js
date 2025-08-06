const mongoose = require('mongoose');
const { Schema } = mongoose;

const moduleSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    thumbnail: {
      type: String,
      trim: true,
    },
    videoUrl: {
      type: String,
      trim: true,
    },
    textContent: {
      header: {
        type: String,
        trim: true,
      },
      subtext: {
        type: String,
        trim: true,
      },
    },
    resources: [{
      title: {
        type: String,
        trim: true,
        required: true,
      },
      url: {
        type: String,
        trim: true,
        required: true,
      },
    }],
    transcript: {
      type: String,
      trim: true,
    },
    duration: {
      type: Number,
      default: 0,
    },
    order: {
      type: Number,
      default: 0,
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
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

// Index for ordering modules
moduleSchema.index({ order: 1 });

// Index for soft delete queries
moduleSchema.index({ deletedAt: 1 });

// Pre-hook to filter out soft deleted documents
moduleSchema.pre(/^find/, function() {
  // Only filter if not explicitly looking for deleted items
  if (!this.getOptions().includeDeleted) {
    this.where({ deletedAt: null });
  }
});

// Method to soft delete
moduleSchema.methods.softDelete = function(userId) {
  this.deletedAt = new Date();
  this.deletedBy = userId;
  return this.save();
};

// Method to restore soft deleted item
moduleSchema.methods.restore = function() {
  this.deletedAt = null;
  this.deletedBy = null;
  return this.save();
};

const Module = mongoose.models.Module || mongoose.model('Module', moduleSchema);

module.exports = Module;