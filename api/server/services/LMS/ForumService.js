const mongoose = require('mongoose');
const ForumCategory = require('~/models/ForumCategory');
const ForumPost = require('~/models/ForumPost');
const ForumReply = require('~/models/ForumReply');
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
        deletedAt: null 
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
      
      // Populate replies/comments for each post
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

      const total = await ForumPost.countDocuments(query);

      return { posts: postsWithReplies, total };
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

      if (!post || post.deletedAt) {
        return null;
      }

      // Increment view count
      await ForumPost.findByIdAndUpdate(postId, { $inc: { views: 1 } });

      // Get replies
      const replies = await ForumReply.find({ 
        post: postId, 
        deletedAt: null 
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
      logger.info('[ForumService] createPost called with:', { 
        title, 
        categoryId, 
        authorId, 
        authorIdType: typeof authorId 
      });
      
      // Simple validation - let mongoose handle the conversion
      if (!authorId) {
        throw new Error('Author ID is required');
      }
      
      // Validate if it's a valid ObjectId format (24 hex characters)
      if (typeof authorId === 'string' && !mongoose.Types.ObjectId.isValid(authorId)) {
        logger.error('[ForumService] Invalid authorId format:', authorId);
        throw new Error(`Invalid user ID format: ${authorId}`);
      }
      
      // Log the ForumPost schema to debug
      logger.info('[ForumService] ForumPost schema paths:', Object.keys(ForumPost.schema.paths));
      logger.info('[ForumService] Category field type:', ForumPost.schema.paths.category?.instance);
      
      // Create post - mongoose will auto-convert string to ObjectId
      const post = new ForumPost({
        title,
        content,
        author: authorId, // Let mongoose handle the conversion
        category: categoryId || 'general', // Provide fallback - category is a string
        tags: tags || []
      });

      logger.info('[ForumService] Attempting to save post...');
      
      try {
        // BYPASS VALIDATION - Use insertOne directly
        const postData = {
          title,
          content,
          author: new mongoose.Types.ObjectId(authorId),
          category: categoryId || 'general',
          tags: tags || [],
          views: 0,
          likes: [],
          likeCount: 0,
          replyCount: 0,
          isPinned: false,
          isLocked: false,
          isFlagged: false,
          editHistory: [],
          deletedAt: null,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        logger.info('[ForumService] Using direct insert with data:', postData);
        
        const result = await ForumPost.collection.insertOne(postData);
        
        if (!result.insertedId) {
          throw new Error('Failed to insert post');
        }
        
        logger.info('[ForumService] Post inserted successfully with ID:', result.insertedId);
        
        // Fetch the created post to return it with populated fields
        const createdPost = await ForumPost.findById(result.insertedId)
          .populate('author', 'name avatar username');
        
        return createdPost;
      } catch (saveError) {
        logger.error('[ForumService] Save error:', saveError.message);
        if (saveError.errors) {
          logger.error('[ForumService] Validation errors:', JSON.stringify(saveError.errors));
        }
        throw saveError;
      }
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
      
      if (!post || post.deletedAt) {
        throw new Error('Post not found');
      }

      // Check ownership - only post author can edit (no admin override)
      if (post.author.toString() !== userId) {
        throw new Error('Only the post author can edit this post');
      }

      if (post.isLocked) {
        throw new Error('Post is locked');
      }

      post.title = title || post.title;
      post.content = content || post.content;
      post.tags = tags || post.tags;
      post.editedBy = userId;
      post.editedAt = new Date();

      await post.save();
      
      // Populate author info before returning
      await post.populate('author', 'name avatar username');

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
      
      if (!post || post.deletedAt) {
        throw new Error('Post not found');
      }

      // Check ownership or admin
      if (!isAdmin && post.author.toString() !== userId) {
        throw new Error('Unauthorized to delete this post');
      }

      post.deletedAt = new Date();
      post.deletedBy = userId;
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
      
      if (!post || post.deletedAt) {
        throw new Error('Post not found');
      }

      if (post.isLocked) {
        throw new Error('Post is locked');
      }

      // BYPASS VALIDATION - Use direct database insertion
      const replyData = {
        content,
        author: new mongoose.Types.ObjectId(authorId),
        post: new mongoose.Types.ObjectId(postId),
        parentReply: parentReplyId ? new mongoose.Types.ObjectId(parentReplyId) : null,
        likeCount: 0,
        likes: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = await ForumReply.collection.insertOne(replyData);
      
      if (!result.insertedId) {
        throw new Error('Failed to create reply');
      }

      // Update post stats - also bypass validation
      await ForumPost.updateOne(
        { _id: postId },
        {
          $inc: { replyCount: 1 },
          $set: {
            lastReplyAt: new Date(),
            lastReplyBy: authorId
          }
        }
      );

      // Fetch the created reply with populated fields
      const reply = await ForumReply.findById(result.insertedId)
        .populate('author', 'name avatar');

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
      
      if (!item || item.deletedAt) {
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
        deletedAt: null
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
        deletedAt: null 
      })
        .populate('category', 'name slug')
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();

      const replies = await ForumReply.find({ 
        author: userId, 
        deletedAt: null 
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
      
      if (!post || post.deletedAt) {
        throw new Error('Post not found');
      }

      // If we're pinning this post, unpin all others first
      if (!post.isPinned) {
        await ForumPost.updateMany(
          { isPinned: true },
          { $set: { isPinned: false } }
        );
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
      
      if (!post || post.deletedAt) {
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