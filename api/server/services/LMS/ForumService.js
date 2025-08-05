const { ForumCategory, ForumPost, ForumReply } = require('~/db/models');
const { logger } = require('~/config');

/**
 * Service for managing forum functionality
 */
class ForumService {
  /**
   * Get all forum categories
   */
  async getCategories() {
    try {
      const categories = await ForumCategory.find({ isActive: true })
        .sort({ order: 1 })
        .lean();
      
      return categories;
    } catch (error) {
      logger.error('[ForumService] Error getting categories:', error);
      throw error;
    }
  }

  /**
   * Get posts in a category with pagination
   */
  async getCategoryPosts(categoryId, { limit = 20, offset = 0, sortBy = 'recent' }) {
    try {
      const query = { 
        category: categoryId, 
        isDeleted: false 
      };

      let sortOption = {};
      switch (sortBy) {
        case 'popular':
          sortOption = { likeCount: -1, replyCount: -1 };
          break;
        case 'active':
          sortOption = { lastReplyAt: -1 };
          break;
        case 'recent':
        default:
          sortOption = { isPinned: -1, createdAt: -1 };
      }

      const posts = await ForumPost.find(query)
        .populate('author', 'name avatar')
        .populate('lastReplyBy', 'name')
        .sort(sortOption)
        .limit(limit)
        .skip(offset)
        .lean();

      const total = await ForumPost.countDocuments(query);

      return { posts, total };
    } catch (error) {
      logger.error('[ForumService] Error getting category posts:', error);
      throw error;
    }
  }

  /**
   * Get a single post with replies
   */
  async getPost(postId, userId = null) {
    try {
      const post = await ForumPost.findById(postId)
        .populate('author', 'name avatar')
        .populate('category', 'name slug')
        .lean();

      if (!post || post.isDeleted) {
        return null;
      }

      // Increment view count
      await ForumPost.findByIdAndUpdate(postId, { $inc: { views: 1 } });

      // Get replies
      const replies = await ForumReply.find({ 
        post: postId, 
        isDeleted: false 
      })
        .populate('author', 'name avatar')
        .sort({ createdAt: 1 })
        .lean();

      // Check if user liked the post
      const userLiked = userId && post.likes.some(id => id.toString() === userId);

      return {
        ...post,
        replies,
        userLiked
      };
    } catch (error) {
      logger.error('[ForumService] Error getting post:', error);
      throw error;
    }
  }

  /**
   * Create a new post
   */
  async createPost({ title, content, categoryId, tags = [] }, authorId) {
    try {
      const category = await ForumCategory.findById(categoryId);
      
      if (!category || !category.isActive) {
        throw new Error('Invalid category');
      }

      const post = new ForumPost({
        title,
        content,
        author: authorId,
        category: categoryId,
        tags
      });

      await post.save();

      // Update category stats
      category.postCount += 1;
      category.lastPostAt = new Date();
      await category.save();

      // Populate author info before returning
      await post.populate('author', 'name avatar');

      return post;
    } catch (error) {
      logger.error('[ForumService] Error creating post:', error);
      throw error;
    }
  }

  /**
   * Update a post
   */
  async updatePost(postId, { title, content, tags }, userId) {
    try {
      const post = await ForumPost.findById(postId);
      
      if (!post || post.isDeleted) {
        throw new Error('Post not found');
      }

      // Check ownership
      if (post.author.toString() !== userId) {
        throw new Error('Unauthorized to edit this post');
      }

      if (post.isLocked) {
        throw new Error('Post is locked');
      }

      post.title = title || post.title;
      post.content = content || post.content;
      post.tags = tags || post.tags;
      post.editedBy = userId;

      await post.save();

      return post;
    } catch (error) {
      logger.error('[ForumService] Error updating post:', error);
      throw error;
    }
  }

  /**
   * Delete a post (soft delete)
   */
  async deletePost(postId, userId, isAdmin = false) {
    try {
      const post = await ForumPost.findById(postId);
      
      if (!post || post.isDeleted) {
        throw new Error('Post not found');
      }

      // Check ownership or admin
      if (!isAdmin && post.author.toString() !== userId) {
        throw new Error('Unauthorized to delete this post');
      }

      post.isDeleted = true;
      await post.save();

      // Update category stats
      await ForumCategory.findByIdAndUpdate(post.category, {
        $inc: { postCount: -1 }
      });

      return { success: true };
    } catch (error) {
      logger.error('[ForumService] Error deleting post:', error);
      throw error;
    }
  }

  /**
   * Create a reply
   */
  async createReply({ content, postId, parentReplyId = null }, authorId) {
    try {
      const post = await ForumPost.findById(postId);
      
      if (!post || post.isDeleted) {
        throw new Error('Post not found');
      }

      if (post.isLocked) {
        throw new Error('Post is locked');
      }

      const reply = new ForumReply({
        content,
        author: authorId,
        post: postId,
        parentReply: parentReplyId
      });

      await reply.save();

      // Update post stats
      post.replyCount += 1;
      post.lastReplyAt = new Date();
      post.lastReplyBy = authorId;
      await post.save();

      // Populate author info
      await reply.populate('author', 'name avatar');

      return reply;
    } catch (error) {
      logger.error('[ForumService] Error creating reply:', error);
      throw error;
    }
  }

  /**
   * Toggle like on a post or reply
   */
  async toggleLike(itemId, userId, itemType = 'post') {
    try {
      const Model = itemType === 'post' ? ForumPost : ForumReply;
      const item = await Model.findById(itemId);
      
      if (!item || item.isDeleted) {
        throw new Error(`${itemType} not found`);
      }

      const likeIndex = item.likes.indexOf(userId);
      
      if (likeIndex === -1) {
        // Add like
        item.likes.push(userId);
      } else {
        // Remove like
        item.likes.splice(likeIndex, 1);
      }

      await item.save();

      return {
        liked: likeIndex === -1,
        likeCount: item.likeCount
      };
    } catch (error) {
      logger.error('[ForumService] Error toggling like:', error);
      throw error;
    }
  }

  /**
   * Search forum posts
   */
  async searchPosts(query, { limit = 20, offset = 0 }) {
    try {
      const searchQuery = {
        $text: { $search: query },
        isDeleted: false
      };

      const posts = await ForumPost.find(searchQuery)
        .populate('author', 'name avatar')
        .populate('category', 'name slug')
        .sort({ score: { $meta: 'textScore' } })
        .limit(limit)
        .skip(offset)
        .lean();

      const total = await ForumPost.countDocuments(searchQuery);

      return { posts, total };
    } catch (error) {
      logger.error('[ForumService] Error searching posts:', error);
      throw error;
    }
  }

  /**
   * Get user's forum activity
   */
  async getUserActivity(userId, { limit = 10 }) {
    try {
      const posts = await ForumPost.find({ 
        author: userId, 
        isDeleted: false 
      })
        .populate('category', 'name slug')
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();

      const replies = await ForumReply.find({ 
        author: userId, 
        isDeleted: false 
      })
        .populate('post', 'title')
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();

      return { posts, replies };
    } catch (error) {
      logger.error('[ForumService] Error getting user activity:', error);
      throw error;
    }
  }

  /**
   * Admin functions
   */
  async togglePinPost(postId) {
    try {
      const post = await ForumPost.findById(postId);
      
      if (!post || post.isDeleted) {
        throw new Error('Post not found');
      }

      post.isPinned = !post.isPinned;
      await post.save();

      return { pinned: post.isPinned };
    } catch (error) {
      logger.error('[ForumService] Error toggling pin:', error);
      throw error;
    }
  }

  async toggleLockPost(postId) {
    try {
      const post = await ForumPost.findById(postId);
      
      if (!post || post.isDeleted) {
        throw new Error('Post not found');
      }

      post.isLocked = !post.isLocked;
      await post.save();

      return { locked: post.isLocked };
    } catch (error) {
      logger.error('[ForumService] Error toggling lock:', error);
      throw error;
    }
  }
}

module.exports = new ForumService();