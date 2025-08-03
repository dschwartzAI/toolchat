// Admin Routes for User Management in LibreChat Business Platform
// Provides endpoints for managing user tiers and access

const express = require('express');
const router = express.Router();
const User = require('./models/User');
const { requireAdmin } = require('./middleware/tierAccess');

// Apply admin requirement to all routes
router.use(requireAdmin);

/**
 * GET /api/admin/users
 * List all users with tier information
 */
router.get('/users', async (req, res) => {
  try {
    const { tier, page = 1, limit = 20, search } = req.query;
    
    // Build query
    const query = {};
    if (tier) query.tier = tier;
    if (search) {
      query.$or = [
        { email: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
        { 'businessMetadata.company': { $regex: search, $options: 'i' } }
      ];
    }
    
    // Pagination
    const skip = (page - 1) * limit;
    
    // Get users
    const users = await User.find(query)
      .select('-password -tokens')
      .sort('-createdAt')
      .skip(skip)
      .limit(parseInt(limit));
    
    // Get total count
    const total = await User.countDocuments(query);
    
    // Get tier statistics
    const tierStats = await User.aggregate([
      { $group: { _id: '$tier', count: { $sum: 1 } } }
    ]);
    
    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        },
        stats: {
          total,
          byTier: tierStats.reduce((acc, stat) => {
            acc[stat._id] = stat.count;
            return acc;
          }, {})
        }
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch users' 
    });
  }
});

/**
 * GET /api/admin/users/:userId
 * Get detailed user information
 */
router.get('/users/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .select('-password -tokens')
      .populate('tierHistory.changedBy', 'name email');
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }
    
    // Get user's recent conversations count
    const Conversation = require('./models/Conversation');
    const conversationCount = await Conversation.countDocuments({ user: user._id });
    
    res.json({
      success: true,
      data: {
        user,
        stats: {
          conversationCount,
          currentUsage: user.currentUsage,
          lastActive: user.businessMetadata?.lastActiveDate
        }
      }
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch user details' 
    });
  }
});

/**
 * PUT /api/admin/users/:userId/tier
 * Update user tier
 */
router.put('/users/:userId/tier', async (req, res) => {
  try {
    const { tier, reason } = req.body;
    const adminId = req.user._id;
    
    // Validate tier
    if (!['free', 'premium', 'admin'].includes(tier)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid tier specified' 
      });
    }
    
    // Update user tier
    const user = await User.upgradeUserTier(
      req.params.userId,
      tier,
      adminId,
      reason || `Manually updated by admin`
    );
    
    res.json({
      success: true,
      data: {
        user,
        message: `User tier updated to ${tier}`
      }
    });
  } catch (error) {
    console.error('Error updating user tier:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update user tier' 
    });
  }
});

/**
 * POST /api/admin/users
 * Create new user with specified tier
 */
router.post('/users', async (req, res) => {
  try {
    const { email, name, tier = 'free', company, industry, sendWelcomeEmail = true } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        error: 'User with this email already exists' 
      });
    }
    
    // Generate temporary password
    const crypto = require('crypto');
    const tempPassword = crypto.randomBytes(8).toString('hex');
    
    // Create user
    const user = new User({
      email,
      name,
      password: tempPassword, // Will be hashed by pre-save middleware
      tier,
      businessMetadata: {
        company,
        industry,
        joinedDate: new Date()
      }
    });
    
    await user.save();
    
    // Send welcome email if requested
    if (sendWelcomeEmail) {
      // TODO: Implement email sending
      console.log(`Welcome email would be sent to ${email} with password: ${tempPassword}`);
    }
    
    res.status(201).json({
      success: true,
      data: {
        user: {
          _id: user._id,
          email: user.email,
          name: user.name,
          tier: user.tier
        },
        tempPassword: sendWelcomeEmail ? null : tempPassword,
        message: sendWelcomeEmail 
          ? 'User created and welcome email sent' 
          : 'User created. Share the temporary password securely.'
      }
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create user' 
    });
  }
});

/**
 * DELETE /api/admin/users/:userId
 * Delete user account
 */
router.delete('/users/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }
    
    // Prevent deleting other admins
    if (user.tier === 'admin' && user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        success: false, 
        error: 'Cannot delete other admin users' 
      });
    }
    
    // Delete user and associated data
    await User.findByIdAndDelete(req.params.userId);
    
    // Also delete user's conversations
    const Conversation = require('./models/Conversation');
    await Conversation.deleteMany({ user: req.params.userId });
    
    res.json({
      success: true,
      message: 'User and associated data deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to delete user' 
    });
  }
});

/**
 * GET /api/admin/stats
 * Get platform statistics
 */
router.get('/stats', async (req, res) => {
  try {
    // User statistics
    const userStats = await User.aggregate([
      {
        $facet: {
          byTier: [
            { $group: { _id: '$tier', count: { $sum: 1 } } }
          ],
          activeToday: [
            {
              $match: {
                'businessMetadata.lastActiveDate': {
                  $gte: new Date(new Date().setHours(0, 0, 0, 0))
                }
              }
            },
            { $count: 'count' }
          ],
          activeThisWeek: [
            {
              $match: {
                'businessMetadata.lastActiveDate': {
                  $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                }
              }
            },
            { $count: 'count' }
          ]
        }
      }
    ]);
    
    // Tool usage statistics
    const toolUsage = await User.aggregate([
      { $unwind: '$businessMetadata.toolUsageCount' },
      {
        $group: {
          _id: '$businessMetadata.toolUsageCount.k',
          totalUsage: { $sum: '$businessMetadata.toolUsageCount.v' }
        }
      },
      { $sort: { totalUsage: -1 } }
    ]);
    
    res.json({
      success: true,
      data: {
        users: {
          total: await User.countDocuments(),
          byTier: userStats[0].byTier,
          activeToday: userStats[0].activeToday[0]?.count || 0,
          activeThisWeek: userStats[0].activeThisWeek[0]?.count || 0
        },
        toolUsage,
        system: {
          version: process.env.npm_package_version || '1.0.0',
          environment: process.env.NODE_ENV
        }
      }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch statistics' 
    });
  }
});

/**
 * POST /api/admin/users/bulk-upgrade
 * Bulk upgrade users to premium
 */
router.post('/users/bulk-upgrade', async (req, res) => {
  try {
    const { userIds, tier, reason } = req.body;
    const adminId = req.user._id;
    
    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'No users specified' 
      });
    }
    
    const results = {
      success: [],
      failed: []
    };
    
    // Process each user
    for (const userId of userIds) {
      try {
        await User.upgradeUserTier(userId, tier, adminId, reason || 'Bulk upgrade');
        results.success.push(userId);
      } catch (error) {
        results.failed.push({ userId, error: error.message });
      }
    }
    
    res.json({
      success: true,
      data: {
        message: `Processed ${userIds.length} users`,
        results
      }
    });
  } catch (error) {
    console.error('Error in bulk upgrade:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to process bulk upgrade' 
    });
  }
});

module.exports = router;