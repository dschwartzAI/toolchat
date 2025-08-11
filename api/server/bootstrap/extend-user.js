/**
 * Extend the existing User schema with custom fields
 * This must be called AFTER mongoose.models.User is created by LibreChat
 * but BEFORE any routes or controllers use the model
 */

const mongoose = require('mongoose');
const { logger } = require('@librechat/data-schemas');

function extendUserSchema() {
  logger.info('[extend-user] Starting User schema extension...');
  logger.debug('[extend-user] Available models:', Object.keys(mongoose.models || {}));
  
  // Get the existing User model that was created by LibreChat
  const User = mongoose.models.User;
  
  if (!User) {
    logger.error('[extend-user] User model not found! Make sure this runs after createModels()');
    logger.error('[extend-user] Available models at error time:', Object.keys(mongoose.models || {}));
    throw new Error('User model must be created before extending');
  }

  logger.info('[extend-user] Found User model, adding custom fields...');
  
  // CRITICAL: Set strict mode to false to allow dynamic fields
  // This is necessary because we're adding fields after model compilation
  User.schema.set('strict', false);
  logger.info('[extend-user] Set schema strict mode to false to allow custom fields');
  
  // Add custom fields to the existing schema
  User.schema.add({
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
    jobTitle: {
      type: String  // User's job title/position
    },
    industry: {
      type: String
    },
    location: {
      type: String  // City, State/Country format
    },
    bio: {
      type: String,
      maxlength: [500, 'Bio cannot exceed 500 characters']
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
    
    // Subscription tracking
    subscriptionStatus: {
      type: String,
      enum: ['active', 'cancelled', 'past_due', 'trialing'],
      default: 'active'
    },
    subscriptionEndDate: {
      type: Date
    },
    
    // Feature flags
    features: {
      darkjk: { type: Boolean, default: true },
      hybridOffer: { type: Boolean, default: true },
      clientMachine: { type: Boolean, default: true },
      idealClient: { type: Boolean, default: true },
      sovereign: { type: Boolean, default: true },
      workshop: { type: Boolean, default: true }
    },
    
    // Onboarding & tracking
    onboardingCompleted: {
      type: Boolean,
      default: false
    },
    lastLoginAt: {
      type: Date
    },
    loginCount: {
      type: Number,
      default: 0
    },
    
    // Integration tokens - removed to avoid conflicts
    // refreshToken is already defined in LibreChat's schema
    // totpSecret is already defined in LibreChat's schema
  });

  // Add methods that were on the original schema
  User.schema.methods.generateToken = function() {
    const jwt = require('jsonwebtoken');
    const payload = {
      id: this._id.toString(),
      email: this.email,
      tier: this.tier || 'premium',
      provider: this.provider,
      username: this.username
    };
    
    return jwt.sign(payload, process.env.JWT_SECRET || process.env.JWT_REFRESH_SECRET, {
      expiresIn: process.env.SESSION_EXPIRY || '30d'
    });
  };

  User.schema.methods.generateRefreshToken = function() {
    const jwt = require('jsonwebtoken');
    const payload = {
      id: this._id.toString(),
      email: this.email
    };
    
    return jwt.sign(payload, process.env.JWT_SECRET || process.env.JWT_REFRESH_SECRET, {
      expiresIn: '7d'
    });
  };

  User.schema.methods.toProfileJSON = function() {
    return {
      id: this._id,
      email: this.email,
      username: this.username,
      name: this.name,
      bio: this.bio,
      location: this.location,
      jobTitle: this.jobTitle,
      company: this.company,
      tier: this.tier,
      avatar: this.avatar,
      features: this.features
    };
  };

  User.schema.methods.canAccessPremiumFeatures = function() {
    return this.tier === 'premium' || this.tier === 'admin';
  };

  User.schema.methods.isAdmin = function() {
    return this.tier === 'admin' || this.role === 'ADMIN';
  };

  // Static methods
  User.schema.statics.checkTierLimits = async function(userId) {
    const user = await this.findById(userId);
    if (!user) return { allowed: false, reason: 'User not found' };
    
    if (user.tier === 'admin') return { allowed: true };
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (user.monthlyUsage.lastReset < today.setDate(1)) {
      user.monthlyUsage = {
        conversations: 0,
        messages: 0,
        documentsGenerated: 0,
        lastReset: today
      };
      await user.save();
    }
    
    const dailyMessages = user.monthlyUsage.messages;
    const monthlyConversations = user.monthlyUsage.conversations;
    
    if (dailyMessages >= user.limits.messagesPerDay) {
      return { allowed: false, reason: 'Daily message limit reached' };
    }
    
    if (monthlyConversations >= user.limits.conversationsPerMonth) {
      return { allowed: false, reason: 'Monthly conversation limit reached' };
    }
    
    return { allowed: true };
  };

  logger.info('[extend-user] User schema extended with custom fields');
  
  // Return the extended model
  return User;
}

module.exports = extendUserSchema;