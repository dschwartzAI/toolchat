const { ForumService } = require('~/server/services/LMS');
const { SystemRoles } = require('librechat-data-provider');
const { logger } = require('~/config');

const ForumController = {
  /**
   * Get forum categories
   */
  async getCategories(req, res) {
    try {
      logger.info('[ForumController] Getting categories - request received');
      // For now, return static categories until we implement dynamic categories
      const categories = [
        { _id: 'general', name: 'General Discussion', description: 'General Academy discussion' },
        { _id: 'questions', name: 'Questions & Help', description: 'Ask questions and get help' },
        { _id: 'success-stories', name: 'Success Stories', description: 'Share your wins and achievements' },
        { _id: 'resources', name: 'Resources & Tools', description: 'Share useful resources and tools' },
        { _id: 'announcements', name: 'Announcements', description: 'Official Academy announcements' }
      ];
      logger.info('[ForumController] Returning categories:', categories);
      res.json(categories);
    } catch (error) {
      logger.error('[ForumController] Error getting categories:', error);
      res.status(500).json({ error: 'Failed to fetch categories' });
    }
  },

  /**
   * Get all posts
   */
  async getAllPosts(req, res) {
    try {
      logger.info('[ForumController] Getting all posts - request received');
      const { limit = 20, offset = 0, sortBy = 'recent' } = req.query;
      
      const ForumPost = require('~/models/ForumPost');
      
      let sortOptions = {};
      switch (sortBy) {
        case 'recent':
          sortOptions = { createdAt: -1 };
          break;
        case 'popular':
          sortOptions = { likeCount: -1, createdAt: -1 };
          break;
        case 'replies':
          sortOptions = { replyCount: -1, createdAt: -1 };
          break;
        default:
          sortOptions = { createdAt: -1 };
      }
      
      const posts = await ForumPost.find({ deletedAt: null })
        .populate('author', 'name avatar')
        .populate('lastReplyBy', 'name')
        .sort(sortOptions)
        .limit(parseInt(limit))
        .skip(parseInt(offset))
        .lean();

      // Manually populate category since it uses string references
      const ForumCategory = require('~/models/ForumCategory');
      try {
        for (const post of posts) {
          if (post.category) {
            logger.debug(`[ForumController] Looking up category: ${post.category}`);
            const category = await ForumCategory.findById(post.category).lean();
            logger.debug(`[ForumController] Found category:`, category);
            post.category = category ? { name: category.name, description: category.description } : { name: 'Unknown', description: '' };
          }
        }
      } catch (categoryError) {
        logger.error(`[ForumController] Error populating categories:`, categoryError);
        // Continue with posts but without category data
        posts.forEach(post => {
          if (post.category && typeof post.category === 'string') {
            post.category = { name: post.category, description: '' };
          }
        });
      }
      
      // Populate replies/comments for each post
      const ForumReply = require('~/models/ForumReply');
      const postsWithReplies = await Promise.all(posts.map(async (post) => {
        const replies = await ForumReply.find({ 
          post: post._id, 
          deletedAt: null 
        })
          .populate('author', 'name avatar')
          .sort({ createdAt: 1 })
          .lean();
        
        return {
          ...post,
          comments: replies // Add replies as comments field expected by frontend
        };
      }));
      
      const total = await ForumPost.countDocuments({ deletedAt: null });
      
      logger.info(`[ForumController] Found ${postsWithReplies.length} posts out of ${total} total`);
      logger.info(`[ForumController] Sample post structure:`, postsWithReplies[0] ? {
        id: postsWithReplies[0]._id,
        title: postsWithReplies[0].title,
        category: postsWithReplies[0].category,
        author: postsWithReplies[0].author,
        commentsCount: postsWithReplies[0].comments?.length || 0
      } : 'No posts found');
      
      res.json({
        posts: postsWithReplies,
        total,
        hasMore: (parseInt(offset) + postsWithReplies.length) < total
      });
    } catch (error) {
      logger.error('[ForumController] Error getting all posts:', error);
      res.status(500).json({ error: 'Failed to fetch posts' });
    }
  },

  /**
   * Get posts in category
   */
  async getCategoryPosts(req, res) {
    try {
      const { categoryId } = req.params;
      const { limit = 20, offset = 0, sortBy = 'recent' } = req.query;
      
      const result = await ForumService.getCategoryPosts(categoryId, {
        limit: parseInt(limit),
        offset: parseInt(offset),
        sortBy
      });

      res.json(result);
    } catch (error) {
      logger.error('[ForumController] Error getting category posts:', error);
      res.status(500).json({ error: 'Failed to fetch posts' });
    }
  },

  /**
   * Get single post with replies
   */
  async getPost(req, res) {
    try {
      const { postId } = req.params;
      const post = await ForumService.getPost(postId, req.user.id);

      if (!post) {
        return res.status(404).json({ error: 'Post not found' });
      }

      res.json(post);
    } catch (error) {
      logger.error('[ForumController] Error getting post:', error);
      res.status(500).json({ error: 'Failed to fetch post' });
    }
  },

  /**
   * Create new post
   */
  async createPost(req, res) {
    try {
      const { title, content, categoryId, tags } = req.body;
      
      logger.info('[ForumController] createPost - req.user:', JSON.stringify({
        id: req.user?.id,
        _id: req.user?._id,
        role: req.user?.role,
        username: req.user?.username
      }));
      logger.info('[ForumController] createPost - req.body:', req.body);
      
      if (!title || !content || !categoryId) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Get user ID from req.user (could be _id or id)
      const userId = req.user?.id || req.user?._id;
      
      if (!userId) {
        logger.error('[ForumController] No user ID found in request');
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const post = await ForumService.createPost({
        title,
        content,
        categoryId,
        tags
      }, userId);

      res.status(201).json(post);
    } catch (error) {
      logger.error('[ForumController] Error creating post:', error.message);
      logger.error('[ForumController] Error stack:', error.stack);
      logger.error('[ForumController] Full error:', JSON.stringify(error, null, 2));
      
      // Return more detailed error for debugging
      res.status(500).json({ 
        error: error.message || 'Failed to create post',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  },

  /**
   * Update post (preserves edit history)
   */
  async updatePost(req, res) {
    try {
      const { postId } = req.params;
      const { title, content, tags } = req.body;
      const userId = req.user.id;
      
      logger.info('[ForumController] updatePost - postId:', postId);
      logger.info('[ForumController] updatePost - userId:', userId);
      logger.info('[ForumController] updatePost - req.user:', req.user);

      // Get the post to check ownership
      const ForumPost = require('~/models/ForumPost');
      const post = await ForumPost.findById(postId);
      
      if (!post) {
        return res.status(404).json({ error: 'Post not found' });
      }

      // Check authorization - only post author can edit (admins cannot edit others' posts)
      if (post.author.toString() !== userId) {
        return res.status(403).json({ error: 'Only the post author can edit this post' });
      }

      // Build update object
      const updateData = {
        editedAt: new Date(),
        editedBy: userId
      };
      
      if (title !== undefined) updateData.title = title;
      if (content !== undefined) updateData.content = content;
      if (tags !== undefined) updateData.tags = tags;

      // BYPASS VALIDATION - Direct database update (like we did for delete)
      const result = await ForumPost.updateOne(
        { _id: postId },
        { $set: updateData }
      );
      
      logger.info('[ForumController] Update result:', result);
      
      if (result.modifiedCount === 0) {
        return res.status(400).json({ error: 'No changes made to post' });
      }
      
      // Fetch the updated post
      const updatedPost = await ForumPost.findById(postId)
        .populate('author', 'name avatar username');
      
      res.json(updatedPost);
    } catch (error) {
      logger.error('[ForumController] Error updating post:', error);
      logger.error('[ForumController] Error stack:', error.stack);
      res.status(500).json({ error: error.message || 'Failed to update post' });
    }
  },

  /**
   * Delete post (soft delete)
   */
  async deletePost(req, res) {
    try {
      const { postId } = req.params;
      const userId = req.user.id;
      
      logger.info(`[ForumController] Delete post request for ID: ${postId}`);
      
      // Import required models
      const User = require('~/models/User');
      const ForumPost = require('~/models/ForumPost');
      
      // Check authorization
      const userDoc = await User.findById(userId);
      const isAdmin = userDoc?.role === SystemRoles.ADMIN || req.user.role === SystemRoles.ADMIN;
      
      const post = await ForumPost.findById(postId);
      if (!post) {
        return res.status(404).json({ error: 'Post not found' });
      }
      
      if (!isAdmin && post.author.toString() !== userId) {
        return res.status(403).json({ error: 'Not authorized to delete this post' });
      }
      
      // BYPASS VALIDATION - Direct database update
      const result = await ForumPost.updateOne(
        { _id: postId },
        {
          $set: {
            deletedAt: new Date(),
            deletedBy: userId
          }
        }
      );
      
      if (result.modifiedCount === 0) {
        throw new Error('Failed to update post');
      }
      
      res.json({ 
        success: true,
        message: 'Post deleted successfully',
        postId: postId
      });
      
    } catch (error) {
      logger.error('[ForumController] Error deleting post:', error);
      res.status(500).json({ 
        error: 'Failed to delete post',
        details: error.message
      });
    }
  },

  /**
   * Create reply
   */
  async createReply(req, res) {
    try {
      const { postId } = req.params;
      const { content, parentReplyId } = req.body;

      if (!content) {
        return res.status(400).json({ error: 'Content is required' });
      }

      const reply = await ForumService.createReply({
        content,
        postId,
        parentReplyId
      }, req.user.id);

      res.status(201).json(reply);
    } catch (error) {
      logger.error('[ForumController] Error creating reply:', error);
      res.status(500).json({ error: 'Failed to create reply' });
    }
  },

  /**
   * Toggle like
   */
  async toggleLike(req, res) {
    try {
      const { itemId } = req.params;
      const { itemType = 'post' } = req.body;

      const result = await ForumService.toggleLike(itemId, req.user.id, itemType);
      res.json(result);
    } catch (error) {
      logger.error('[ForumController] Error toggling like:', error);
      res.status(500).json({ error: 'Failed to toggle like' });
    }
  },

  /**
   * Search posts
   */
  async searchPosts(req, res) {
    try {
      const { q, limit = 20, offset = 0 } = req.query;

      if (!q) {
        return res.status(400).json({ error: 'Search query required' });
      }

      const result = await ForumService.searchPosts(q, {
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      res.json(result);
    } catch (error) {
      logger.error('[ForumController] Error searching posts:', error);
      res.status(500).json({ error: 'Failed to search posts' });
    }
  },

  /**
   * Get user activity
   */
  async getUserActivity(req, res) {
    try {
      const { userId } = req.params;
      const targetUserId = userId || req.user.id;
      
      const activity = await ForumService.getUserActivity(targetUserId);
      res.json(activity);
    } catch (error) {
      logger.error('[ForumController] Error getting user activity:', error);
      res.status(500).json({ error: 'Failed to fetch user activity' });
    }
  },

  /**
   * Admin: Toggle pin post
   */
  async togglePin(req, res) {
    try {
      const { postId } = req.params;
      const result = await ForumService.togglePinPost(postId);
      res.json(result);
    } catch (error) {
      logger.error('[ForumController] Error toggling pin:', error);
      res.status(500).json({ error: 'Failed to toggle pin' });
    }
  },

  /**
   * Admin: Toggle lock post
   */
  async toggleLock(req, res) {
    try {
      const { postId } = req.params;
      const result = await ForumService.toggleLockPost(postId);
      res.json(result);
    } catch (error) {
      logger.error('[ForumController] Error toggling lock:', error);
      res.status(500).json({ error: 'Failed to toggle lock' });
    }
  },

  /**
   * Admin: Restore soft deleted post
   */
  async restorePost(req, res) {
    try {
      const { postId } = req.params;
      const ForumPost = require('~/models/ForumPost');
      
      // Need to include deleted items in query
      const post = await ForumPost.findById(postId).setOptions({ includeDeleted: true });
      
      if (!post) {
        return res.status(404).json({ error: 'Post not found' });
      }
      
      if (!post.deletedAt) {
        return res.status(400).json({ error: 'Post is not deleted' });
      }
      
      await post.restore();
      
      res.json({ 
        success: true,
        message: 'Post restored successfully',
        post 
      });
    } catch (error) {
      logger.error('[ForumController] Error restoring post:', error);
      res.status(500).json({ error: 'Failed to restore post' });
    }
  },

  /**
   * Update reply (preserves edit history for reply)
   */
  async updateReply(req, res) {
    try {
      const { replyId } = req.params;
      const { content } = req.body;
      const userId = req.user.id;
      const isAdmin = req.user.role === SystemRoles.ADMIN;
      
      const ForumReply = require('~/models/ForumReply');
      const reply = await ForumReply.findById(replyId);
      
      if (!reply) {
        return res.status(404).json({ error: 'Reply not found' });
      }
      
      // Check authorization
      if (reply.author.toString() !== userId && !isAdmin) {
        return res.status(403).json({ error: 'Unauthorized to edit this reply' });
      }
      
      // Save edit history if content changed
      if (reply.content !== content) {
        reply.editHistory = reply.editHistory || [];
        reply.editHistory.push({
          content: reply.content,
          editedAt: new Date(),
          editedBy: userId
        });
      }
      
      reply.content = content;
      await reply.save();
      await reply.populate('author', 'name avatar');
      
      res.json(reply);
    } catch (error) {
      logger.error('[ForumController] Error updating reply:', error);
      res.status(500).json({ error: 'Failed to update reply' });
    }
  },

  /**
   * Delete reply (soft delete)
   */
  async deleteReply(req, res) {
    try {
      const { replyId } = req.params;
      const userId = req.user.id;
      
      const User = require('~/models/User');
      const ForumReply = require('~/models/ForumReply');
      const ForumPost = require('~/models/ForumPost');
      
      const userDoc = await User.findById(userId);
      const isAdmin = userDoc?.role === SystemRoles.ADMIN || req.user.role === SystemRoles.ADMIN;
      
      const reply = await ForumReply.findById(replyId);
      if (!reply) {
        return res.status(404).json({ error: 'Reply not found' });
      }
      
      if (!isAdmin && reply.author.toString() !== userId) {
        return res.status(403).json({ error: 'Not authorized to delete this reply' });
      }
      
      // Direct update bypassing validation
      const result = await ForumReply.updateOne(
        { _id: replyId },
        {
          $set: {
            deletedAt: new Date(),
            deletedBy: userId
          }
        }
      );
      
      if (result.modifiedCount === 0) {
        throw new Error('Failed to update reply');
      }
      
      // Update reply count
      await ForumPost.findByIdAndUpdate(reply.post, {
        $inc: { replyCount: -1 }
      });
      
      res.json({ 
        success: true,
        message: 'Reply deleted successfully' 
      });
      
    } catch (error) {
      logger.error('[ForumController] Error deleting reply:', error);
      res.status(500).json({ error: 'Failed to delete reply' });
    }
  },

  /**
   * Admin: Bulk delete posts
   */
  async bulkDeletePosts(req, res) {
    try {
      const { postIds } = req.body;
      
      if (!Array.isArray(postIds) || postIds.length === 0) {
        return res.status(400).json({ error: 'Invalid post IDs' });
      }
      
      const ForumPost = require('~/models/ForumPost');
      
      // Soft delete all posts
      const result = await ForumPost.updateMany(
        { 
          _id: { $in: postIds },
          deletedAt: null // Don't re-delete already deleted posts
        },
        { 
          deletedAt: new Date(),
          deletedBy: req.user.id
        }
      );
      
      res.json({ 
        success: true,
        deleted: result.modifiedCount,
        message: `${result.modifiedCount} posts deleted` 
      });
    } catch (error) {
      logger.error('[ForumController] Error bulk deleting posts:', error);
      res.status(500).json({ error: 'Failed to delete posts' });
    }
  },

  /**
   * Admin: Get moderation stats
   */
  async getModerationStats(req, res) {
    try {
      const ForumPost = require('~/models/ForumPost');
      const ForumReply = require('~/models/ForumReply');
      
      const [
        totalPosts,
        deletedPosts,
        pinnedPosts,
        lockedPosts,
        totalReplies,
        deletedReplies
      ] = await Promise.all([
        ForumPost.countDocuments(),
        ForumPost.countDocuments({ deletedAt: { $ne: null } }),
        ForumPost.countDocuments({ isPinned: true }),
        ForumPost.countDocuments({ isLocked: true }),
        ForumReply.countDocuments(),
        ForumReply.countDocuments({ deletedAt: { $ne: null } })
      ]);
      
      res.json({
        posts: {
          total: totalPosts,
          deleted: deletedPosts,
          pinned: pinnedPosts,
          locked: lockedPosts
        },
        replies: {
          total: totalReplies,
          deleted: deletedReplies
        }
      });
    } catch (error) {
      logger.error('[ForumController] Error getting moderation stats:', error);
      res.status(500).json({ error: 'Failed to get moderation stats' });
    }
  }
};

module.exports = ForumController;