/**
 * Extended User Model for AI Business Tools Platform
 * Adds tier-based access control to LibreChat users
 */

const mongoose = require('mongoose');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
  // Standard LibreChat fields
  name: {
    type: String,
  },
  username: {
    type: String,
    unique: true,
    required: [true, 'Username is required'],
    lowercase: true,
    match: [/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, hyphens and underscores']
  },
  email: {
    type: String,
    unique: true,
    required: [true, 'Email is required'],
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Email is invalid']
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters long']
  },
  avatar: {
    type: String
  },
  provider: {
    type: String,
    default: 'local'
  },
  providerId: {
    type: String
  },
  
  // Business Tools Platform extensions
  tier: {
    type: String,
    enum: ['free', 'premium', 'admin'],
    default: 'premium',
    index: true
  },
  company: {
    type: String
  },
  role: {
    type: String  // Job role/title
  },
  industry: {
    type: String
  },
  
  // Usage tracking
  monthlyUsage: {
    conversations: { type: Number, default: 0 },
    messages: { type: Number, default: 0 },
    documentsGenerated: { type: Number, default: 0 },
    lastReset: { type: Date, default: Date.now }
  },
  
  // Tier limits
  limits: {
    conversationsPerMonth: { type: Number, default: 20 },
    messagesPerDay: { type: Number, default: 50 },
    documentsPerMonth: { type: Number, default: 5 }
  },
  
  // Admin management
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  managedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Subscription info
  subscription: {
    status: { 
      type: String, 
      enum: ['active', 'cancelled', 'expired', 'trial'],
      default: 'active'
    },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date },
    trialEndDate: { type: Date },
    billingEmail: { type: String }
  },
  
  // Feature flags
  features: {
    darkJKCoach: { type: Boolean, default: false },
    hybridOfferCreator: { type: Boolean, default: false },
    customAgents: { type: Boolean, default: false },
    apiAccess: { type: Boolean, default: false },
    teamManagement: { type: Boolean, default: false }
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date
  },
  
  // Soft delete
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes for performance
userSchema.index({ email: 1, isDeleted: 1 });
userSchema.index({ tier: 1, isDeleted: 1 });
userSchema.index({ 'subscription.status': 1 });
userSchema.index({ createdBy: 1 });

// Update tier-based limits when tier changes
userSchema.pre('save', function(next) {
  if (this.isModified('tier')) {
    switch(this.tier) {
      case 'admin':
        this.limits = {
          conversationsPerMonth: -1, // Unlimited
          messagesPerDay: -1,
          documentsPerMonth: -1
        };
        this.features = {
          darkJKCoach: true,
          hybridOfferCreator: true,
          customAgents: true,
          apiAccess: true,
          teamManagement: true
        };
        break;
      case 'premium':
        this.limits = {
          conversationsPerMonth: 1000,
          messagesPerDay: 500,
          documentsPerMonth: 100
        };
        this.features = {
          darkJKCoach: true,
          hybridOfferCreator: true,
          customAgents: false,
          apiAccess: false,
          teamManagement: false
        };
        break;
      case 'free':
      default:
        this.limits = {
          conversationsPerMonth: 20,
          messagesPerDay: 50,
          documentsPerMonth: 5
        };
        this.features = {
          darkJKCoach: false,
          hybridOfferCreator: true, // Limited access
          customAgents: false,
          apiAccess: false,
          teamManagement: false
        };
    }
  }
  next();
});

// Reset monthly usage
userSchema.methods.resetMonthlyUsage = function() {
  const now = new Date();
  const lastReset = this.monthlyUsage.lastReset;
  
  // Check if a month has passed
  if (!lastReset || 
      now.getMonth() !== lastReset.getMonth() || 
      now.getFullYear() !== lastReset.getFullYear()) {
    this.monthlyUsage = {
      conversations: 0,
      messages: 0,
      documentsGenerated: 0,
      lastReset: now
    };
    return this.save();
  }
  return Promise.resolve(this);
};

// Check if user has reached limits
userSchema.methods.checkLimits = function(type) {
  if (this.tier === 'admin') return true; // No limits for admin
  
  // Reset monthly usage if needed
  this.resetMonthlyUsage();
  
  switch(type) {
    case 'conversation':
      return this.limits.conversationsPerMonth === -1 || 
             this.monthlyUsage.conversations < this.limits.conversationsPerMonth;
    case 'message':
      // For daily limit, we'd need to track daily usage separately
      return this.limits.messagesPerDay === -1 || true; // Simplified for now
    case 'document':
      return this.limits.documentsPerMonth === -1 || 
             this.monthlyUsage.documentsGenerated < this.limits.documentsPerMonth;
    default:
      return true;
  }
};

// Increment usage
userSchema.methods.incrementUsage = function(type) {
  switch(type) {
    case 'conversation':
      this.monthlyUsage.conversations += 1;
      break;
    case 'message':
      this.monthlyUsage.messages += 1;
      break;
    case 'document':
      this.monthlyUsage.documentsGenerated += 1;
      break;
  }
  return this.save();
};

// Check feature access
userSchema.methods.hasFeature = function(feature) {
  return this.features[feature] === true;
};

// Generate JWT token
userSchema.methods.generateToken = function() {
  return jwt.sign(
    {
      id: this._id,
      email: this.email,
      tier: this.tier,
      features: this.features
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.SESSION_EXPIRY || '7d' }
  );
};

// Override toJSON to exclude sensitive data
userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  delete obj.__v;
  return obj;
};

// Soft delete method
userSchema.methods.softDelete = function() {
  this.isDeleted = true;
  this.deletedAt = new Date();
  return this.save();
};

// Find only non-deleted users
userSchema.statics.findActive = function(filter = {}) {
  return this.find({ ...filter, isDeleted: false });
};

// Create indexes
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ tier: 1 });

const User = mongoose.models.User || mongoose.model('User', userSchema);

module.exports = User;