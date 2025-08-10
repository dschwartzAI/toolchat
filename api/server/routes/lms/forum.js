const express = require('express');
const router = express.Router();
const { ForumController } = require('~/server/controllers/lms');
const requireJwtAuth = require('~/server/middleware/requireJwtAuth');
const checkAdmin = require('~/server/middleware/roles/admin');

// Category routes
router.get('/categories', requireJwtAuth, ForumController.getCategories);
router.get('/categories/:categoryId/posts', requireJwtAuth, ForumController.getCategoryPosts);

// Post routes
router.get('/posts', requireJwtAuth, ForumController.getAllPosts);
router.get('/posts/:postId', requireJwtAuth, ForumController.getPost);
router.post('/posts', requireJwtAuth, ForumController.createPost);
router.put('/posts/:postId', requireJwtAuth, ForumController.updatePost);
router.delete('/posts/:postId', requireJwtAuth, ForumController.deletePost);

// Reply routes
router.post('/posts/:postId/replies', requireJwtAuth, ForumController.createReply);
router.put('/replies/:replyId', requireJwtAuth, ForumController.updateReply);
router.delete('/replies/:replyId', requireJwtAuth, ForumController.deleteReply);

// Like routes
router.post('/like/:itemId', requireJwtAuth, ForumController.toggleLike);

// Search
router.get('/search', requireJwtAuth, ForumController.searchPosts);

// User activity
router.get('/activity/:userId?', requireJwtAuth, ForumController.getUserActivity);

// Admin routes
router.post('/posts/:postId/pin', requireJwtAuth, checkAdmin, ForumController.togglePin);
router.post('/posts/:postId/lock', requireJwtAuth, checkAdmin, ForumController.toggleLock);
router.post('/posts/:postId/restore', requireJwtAuth, checkAdmin, ForumController.restorePost);
router.post('/posts/bulk/delete', requireJwtAuth, checkAdmin, ForumController.bulkDeletePosts);
router.get('/moderation/stats', requireJwtAuth, checkAdmin, ForumController.getModerationStats);

// Debug route - temporarily available to all authenticated users
router.get('/test/replies', requireJwtAuth, ForumController.testReplyDeletion);

module.exports = router;