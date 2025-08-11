const express = require('express');
const router = express.Router();
const { requireJwtAuth } = require('~/server/middleware');
const User = require('~/models/User');
const { logger } = require('~/config');

/**
 * GET /api/academy/members
 * Returns up to 500 users with limited fields for the members directory
 * Auth required
 */
router.get('/', requireJwtAuth, async (req, res) => {
  try {
    // Fetch up to 500 users, excluding deleted and only selecting safe fields
    const users = await User.find(
      { 
        isDeleted: { $ne: true },
        // Exclude system/test accounts if needed
        email: { $not: /^(system|test|admin@librechat)/ }
      },
      {
        _id: 1,
        name: 1,
        username: 1,
        avatar: 1,
        bio: 1,
        role: 1,
        company: 1,
        location: 1
      }
    )
    .limit(500)
    .sort({ createdAt: -1 })
    .lean();

    // Transform to frontend-friendly format
    const members = users.map(user => ({
      id: user._id.toString(),
      name: user.name || 'Anonymous User',
      username: user.username || null,
      avatarUrl: user.avatar || '',
      // Use bio field if available, otherwise combine role and company
      bio: user.bio || [user.role, user.company].filter(Boolean).join(' at ') || null,
      location: user.location || null
    }));

    res.json({ members });
  } catch (error) {
    logger.error('[Members] Error fetching members:', error);
    res.status(500).json({ error: 'Failed to fetch members' });
  }
});

module.exports = router;