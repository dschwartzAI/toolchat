/**
 * Admin Routes for AI Business Tools Platform
 * Handles user management and tier administration
 */

const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { checkTierAccess } = require('../middleware/tierAccess');
const bcrypt = require('bcryptjs');

// All admin routes require admin tier
router.use(checkTierAccess('admin'));

/**
 * Get all users with pagination
 */
router.get('/users', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    const filter = { isDeleted: false };
    
    // Add tier filter if provided
    if (req.query.tier) {
      filter.tier = req.query.tier;
    }
    
    // Add search filter if provided
    if (req.query.search) {
      filter.$or = [
        { email: { $regex: req.query.search, $options: 'i' } },
        { name: { $regex: req.query.search, $options: 'i' } },
        { company: { $regex: req.query.search, $options: 'i' } }
      ];
    }
    
    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(filter)
    ]);
    
    res.json({
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

/**
 * Get single user details
 */
router.get('/users/:userId', async (req, res) => {
  try {
    const user = await User.findOne({ 
      _id: req.params.userId,
      isDeleted: false 
    }).select('-password');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

/**
 * Create new user
 */
router.post('/users', async (req, res) => {
  try {
    const {
      email,
      username,
      password,
      name,
      tier = 'free',
      company,
      role,
      industry
    } = req.body;
    
    // Validate required fields
    if (!email || !username || !password) {
      return res.status(400).json({ 
        error: 'Email, username, and password are required' 
      });
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
      isDeleted: false
    });
    
    if (existingUser) {
      return res.status(400).json({ 
        error: 'User with this email or username already exists' 
      });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user
    const user = new User({
      email,
      username,
      password: hashedPassword,
      name,
      tier,
      company,
      role,
      industry,
      createdBy: req.user._id,
      managedBy: req.user._id
    });
    
    await user.save();
    
    // Return user without password
    const userResponse = user.toJSON();
    delete userResponse.password;
    
    res.status(201).json({
      message: 'User created successfully',
      user: userResponse
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

/**
 * Update user details
 */
router.put('/users/:userId', async (req, res) => {
  try {
    const allowedUpdates = [
      'name', 'tier', 'company', 'role', 'industry',
      'subscription', 'features', 'limits'
    ];
    
    const updates = {};
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });
    
    updates.updatedAt = new Date();
    
    const user = await User.findOneAndUpdate(
      { _id: req.params.userId, isDeleted: false },
      updates,
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      message: 'User updated successfully',
      user
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

/**
 * Update user tier
 */
router.patch('/users/:userId/tier', async (req, res) => {
  try {
    const { tier } = req.body;
    
    if (!['free', 'premium', 'admin'].includes(tier)) {
      return res.status(400).json({ 
        error: 'Invalid tier. Must be: free, premium, or admin' 
      });
    }
    
    const user = await User.findOneAndUpdate(
      { _id: req.params.userId, isDeleted: false },
      { 
        tier,
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      message: `User tier updated to ${tier}`,
      user
    });
  } catch (error) {
    console.error('Error updating user tier:', error);
    res.status(500).json({ error: 'Failed to update user tier' });
  }
});

/**
 * Reset user password
 */
router.patch('/users/:userId/password', async (req, res) => {
  try {
    const { password } = req.body;
    
    if (!password || password.length < 8) {
      return res.status(400).json({ 
        error: 'Password must be at least 8 characters long' 
      });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = await User.findOneAndUpdate(
      { _id: req.params.userId, isDeleted: false },
      { 
        password: hashedPassword,
        updatedAt: new Date()
      }
    );
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

/**
 * Delete user (soft delete)
 */
router.delete('/users/:userId', async (req, res) => {
  try {
    const user = await User.findOne({ 
      _id: req.params.userId,
      isDeleted: false 
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Prevent deleting other admins
    if (user.tier === 'admin' && user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        error: 'Cannot delete other admin users' 
      });
    }
    
    await user.softDelete();
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

/**
 * Get usage statistics
 */
router.get('/stats/usage', async (req, res) => {
  try {
    const stats = await User.aggregate([
      { $match: { isDeleted: false } },
      {
        $group: {
          _id: '$tier',
          count: { $sum: 1 },
          totalConversations: { $sum: '$monthlyUsage.conversations' },
          totalMessages: { $sum: '$monthlyUsage.messages' },
          totalDocuments: { $sum: '$monthlyUsage.documentsGenerated' }
        }
      }
    ]);
    
    const overall = await User.aggregate([
      { $match: { isDeleted: false } },
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          totalConversations: { $sum: '$monthlyUsage.conversations' },
          totalMessages: { $sum: '$monthlyUsage.messages' },
          totalDocuments: { $sum: '$monthlyUsage.documentsGenerated' }
        }
      }
    ]);
    
    res.json({
      byTier: stats,
      overall: overall[0] || {
        totalUsers: 0,
        totalConversations: 0,
        totalMessages: 0,
        totalDocuments: 0
      }
    });
  } catch (error) {
    console.error('Error fetching usage stats:', error);
    res.status(500).json({ error: 'Failed to fetch usage statistics' });
  }
});

/**
 * Bulk update user tiers
 */
router.post('/users/bulk-update-tier', async (req, res) => {
  try {
    const { userIds, tier } = req.body;
    
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ error: 'User IDs array is required' });
    }
    
    if (!['free', 'premium', 'admin'].includes(tier)) {
      return res.status(400).json({ 
        error: 'Invalid tier. Must be: free, premium, or admin' 
      });
    }
    
    const result = await User.updateMany(
      { 
        _id: { $in: userIds },
        isDeleted: false
      },
      {
        tier,
        updatedAt: new Date()
      }
    );
    
    res.json({
      message: `Updated ${result.modifiedCount} users to ${tier} tier`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Error bulk updating tiers:', error);
    res.status(500).json({ error: 'Failed to bulk update tiers' });
  }
});

module.exports = router;