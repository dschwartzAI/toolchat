// Tier Access Middleware for LibreChat
// Controls access to endpoints and agents based on user tier

const createError = require('http-errors');

/**
 * Middleware to check if user has access to specific endpoint based on tier
 */
const checkEndpointAccess = (req, res, next) => {
  try {
    const user = req.user;
    const requestedEndpoint = req.body.endpoint || req.params.endpoint || req.query.endpoint;
    
    // If no specific endpoint requested, allow
    if (!requestedEndpoint) {
      return next();
    }
    
    // If no user (shouldn't happen with auth), deny
    if (!user) {
      return next(createError(401, 'Authentication required'));
    }
    
    // Check if user can access the endpoint
    if (!user.canAccessEndpoint(requestedEndpoint)) {
      const message = user.tier === 'free' 
        ? 'This tool requires a Premium subscription. Please contact your administrator to upgrade.'
        : 'You don\'t have permission to use this tool.';
      
      return res.status(403).json({
        error: {
          message: message,
          type: 'tier_restriction',
          userTier: user.tier,
          requiredTier: 'premium'
        }
      });
    }
    
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to check if user has access to specific agent based on tier
 */
const checkAgentAccess = async (req, res, next) => {
  try {
    const user = req.user;
    const agentId = req.body.agent || req.params.agentId || req.query.agentId;
    
    if (!agentId) {
      return next();
    }
    
    if (!user) {
      return next(createError(401, 'Authentication required'));
    }
    
    // Get agent metadata from database
    const Agent = require('./models/Agent'); // Assuming agent model
    const agent = await Agent.findById(agentId);
    
    if (!agent) {
      return next(createError(404, 'Business tool not found'));
    }
    
    // Check if user can access the agent
    if (!user.canAccessAgent(agent.metadata)) {
      const requiredTier = agent.metadata?.requiredTier || 'premium';
      const message = `This business tool requires a ${requiredTier} subscription. Please contact your administrator.`;
      
      return res.status(403).json({
        error: {
          message: message,
          type: 'tier_restriction',
          userTier: user.tier,
          requiredTier: requiredTier,
          agentName: agent.name
        }
      });
    }
    
    // Track tool usage
    if (user.businessMetadata) {
      user.businessMetadata.lastToolUsed = agent.name;
      const toolUsageCount = user.businessMetadata.toolUsageCount || new Map();
      toolUsageCount.set(agent.name, (toolUsageCount.get(agent.name) || 0) + 1);
      user.businessMetadata.toolUsageCount = toolUsageCount;
      await user.save();
    }
    
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to check usage limits based on tier
 */
const checkUsageLimit = (limitType) => {
  return async (req, res, next) => {
    try {
      const user = req.user;
      
      if (!user) {
        return next(createError(401, 'Authentication required'));
      }
      
      // Check if user has reached their limit
      if (!user.checkUsageLimit(limitType)) {
        const limit = user.usageLimits[limitType];
        const resetTime = user.currentUsage[limitType]?.resetAt;
        const hoursUntilReset = Math.ceil((resetTime - new Date()) / (1000 * 60 * 60));
        
        const message = user.tier === 'free'
          ? `You've reached your daily limit of ${limit} ${limitType.replace('daily', '').toLowerCase()}. Upgrade to Premium for higher limits or wait ${hoursUntilReset} hours.`
          : `You've reached your daily limit. Please try again in ${hoursUntilReset} hours.`;
        
        return res.status(429).json({
          error: {
            message: message,
            type: 'usage_limit_exceeded',
            limitType: limitType,
            currentUsage: user.currentUsage[limitType]?.count || 0,
            limit: limit,
            resetAt: resetTime,
            userTier: user.tier
          }
        });
      }
      
      // Increment usage counter
      await user.incrementUsage(limitType);
      
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware to filter available endpoints/agents based on user tier
 */
const filterByTier = (req, res, next) => {
  try {
    const user = req.user;
    
    if (!user) {
      return next(createError(401, 'Authentication required'));
    }
    
    // Attach tier info to request for downstream use
    req.userTier = {
      tier: user.tier,
      isAdmin: user.tier === 'admin',
      isPremium: user.tier === 'premium' || user.tier === 'admin',
      isFree: user.tier === 'free',
      allowedEndpoints: user.allowedEndpoints || [],
      limits: user.usageLimits
    };
    
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware for admin-only routes
 */
const requireAdmin = (req, res, next) => {
  const user = req.user;
  
  if (!user) {
    return next(createError(401, 'Authentication required'));
  }
  
  if (user.tier !== 'admin' && user.role !== 'admin') {
    return res.status(403).json({
      error: {
        message: 'This action requires administrator privileges.',
        type: 'admin_required'
      }
    });
  }
  
  next();
};

/**
 * Middleware to attach tier-based configuration to response
 */
const attachTierConfig = (req, res, next) => {
  const user = req.user;
  
  if (user) {
    // Attach tier configuration to all responses
    res.locals.tierConfig = {
      userTier: user.tier,
      displayTier: user.displayTier,
      limits: {
        messages: user.usageLimits.dailyMessages,
        uploads: user.usageLimits.dailyFileUploads,
        conversations: user.usageLimits.maxConversations
      },
      features: {
        canUseCoaching: user.tier !== 'free',
        canUseAllTools: user.tier !== 'free',
        canUploadFiles: true,
        canExportData: user.tier !== 'free',
        hasUnlimitedConversations: user.tier === 'admin',
        hasPrioritySupport: user.tier === 'premium' || user.tier === 'admin'
      }
    };
  }
  
  next();
};

/**
 * Rate limiting middleware based on tier
 */
const tierRateLimit = (req, res, next) => {
  const user = req.user;
  
  if (!user) {
    return next();
  }
  
  // Set rate limit based on tier
  const rateLimits = {
    free: { windowMs: 60000, max: 20 },      // 20 requests per minute
    premium: { windowMs: 60000, max: 100 },   // 100 requests per minute
    admin: { windowMs: 60000, max: 1000 }     // 1000 requests per minute
  };
  
  const limit = rateLimits[user.tier] || rateLimits.free;
  
  // Apply rate limit to request
  req.rateLimit = limit;
  
  next();
};

// Export middleware functions
module.exports = {
  checkEndpointAccess,
  checkAgentAccess,
  checkUsageLimit,
  filterByTier,
  requireAdmin,
  attachTierConfig,
  tierRateLimit,
  
  // Convenience middleware combinations
  messageLimit: checkUsageLimit('dailyMessages'),
  uploadLimit: checkUsageLimit('dailyFileUploads'),
  
  // Apply all tier checks
  applyTierRestrictions: [
    filterByTier,
    attachTierConfig,
    tierRateLimit
  ]
};