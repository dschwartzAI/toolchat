const { ForumService } = require('~/server/services/LMS');
const { SystemRoles } = require('librechat-data-provider');
const { logger } = require('~/config');

const ForumController = {
  /**
   * Get forum categories
   */
  async getCategories(req, res) {
    try {
      const categories = await ForumService.getCategories();
      res.json(categories);
    } catch (error) {
      logger.error('[ForumController] Error getting categories:', error);
      res.status(500).json({ error: 'Failed to fetch categories' });
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
      
      if (!title || !content || !categoryId) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const post = await ForumService.createPost({
        title,
        content,
        categoryId,
        tags
      }, req.user.id);

      res.status(201).json(post);
    } catch (error) {
      logger.error('[ForumController] Error creating post:', error);
      res.status(500).json({ error: 'Failed to create post' });
    }
  },

  /**
   * Update post (preserves edit history)
   */
  async updatePost(req, res) {
    try {
      const { postId } = req.params;
      const { title, content, tags } = req.body;
      const isAdmin = req.user.role === SystemRoles.ADMIN;

      // Get the post to check ownership and save edit history
      const ForumPost = require('~/models/ForumPost');
      const post = await ForumPost.findById(postId);
      
      if (!post) {
        return res.status(404).json({ error: 'Post not found' });
      }

      // Check authorization
      if (post.author.toString() !== req.user.id && !isAdmin) {
        return res.status(403).json({ error: 'Unauthorized to edit this post' });
      }

      // Save edit history
      if (post.content !== content || post.title !== title) {
        post.addEditHistory(req.user.id, post.content, post.title);
      }

      // Update fields
      if (title !== undefined) post.title = title;
      if (content !== undefined) post.content = content;
      if (tags !== undefined) post.tags = tags;
      
      await post.save();
      await post.populate('author', 'name avatar');

      res.json(post);
    } catch (error) {
      logger.error('[ForumController] Error updating post:', error);
      res.status(500).json({ error: 'Failed to update post' });
    }
  },

  /**
   * Delete post (soft delete)
   */
  async deletePost(req, res) {
    try {
      const { postId } = req.params;
      const isAdmin = req.user.role === SystemRoles.ADMIN;
      
      const ForumPost = require('~/models/ForumPost');
      const post = await ForumPost.findById(postId);
      
      if (!post) {
        return res.status(404).json({ error: 'Post not found' });
      }
      
      // Check authorization
      if (post.author.toString() !== req.user.id && !isAdmin) {
        return res.status(403).json({ error: 'Unauthorized to delete this post' });
      }
      
      // Perform soft delete
      await post.softDelete(req.user.id);
      
      res.json({ 
        success: true,
        message: 'Post deleted successfully',
        deletedAt: post.deletedAt
      });
    } catch (error) {
      logger.error('[ForumController] Error deleting post:', error);
      res.status(500).json({ error: 'Failed to delete post' });
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
      const isAdmin = req.user.role === SystemRoles.ADMIN;
      
      const ForumReply = require('~/models/ForumReply');
      const reply = await ForumReply.findById(replyId);
      
      if (!reply) {
        return res.status(404).json({ error: 'Reply not found' });
      }
      
      // Check authorization
      if (reply.author.toString() !== req.user.id && !isAdmin) {
        return res.status(403).json({ error: 'Unauthorized to edit this reply' });
      }
      
      // Save edit history if content changed
      if (reply.content !== content) {
        reply.editHistory = reply.editHistory || [];
        reply.editHistory.push({
          content: reply.content,
          editedAt: new Date(),
          editedBy: req.user.id
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
      const isAdmin = req.user.role === SystemRoles.ADMIN;
      
      const ForumReply = require('~/models/ForumReply');
      const reply = await ForumReply.findById(replyId);
      
      if (!reply) {
        return res.status(404).json({ error: 'Reply not found' });
      }
      
      // Check authorization
      if (reply.author.toString() !== req.user.id && !isAdmin) {
        return res.status(403).json({ error: 'Unauthorized to delete this reply' });
      }
      
      // Perform soft delete
      reply.deletedAt = new Date();
      reply.deletedBy = req.user.id;
      await reply.save();
      
      // Update reply count on post
      const ForumPost = require('~/models/ForumPost');
      await ForumPost.findByIdAndUpdate(reply.post, {
        $inc: { replyCount: -1 }
      });
      
      res.json({ 
        success: true,
        message: 'Reply deleted successfully',
        deletedAt: reply.deletedAt
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