const express = require('express');
const router = express.Router();
const { requireJwtAuth } = require('~/server/middleware');
const DirectMessage = require('~/models/DirectMessage');
const DirectConversation = require('~/models/DirectConversation');
const mongoose = require('mongoose');
const getUserModel = () => mongoose.models.User;
const { logger } = require('~/config');

/**
 * GET /api/lms/conversations
 * Get all conversations for the current user
 */
router.get('/conversations', requireJwtAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Find all conversations where user is a participant
    const conversations = await DirectConversation.find({
      participants: userId
    })
    .populate('participants', 'name username avatar role')
    .populate('lastMessage.senderId', 'name')
    .sort({ 'lastMessage.timestamp': -1 });
    
    // Format conversations for frontend
    const formattedConversations = conversations.map(conv => {
      // Get the other participant
      const otherUser = conv.participants.find(p => p._id.toString() !== userId);
      
      // Handle unreadCount - it's a Map when not using .lean()
      let unreadCount = 0;
      if (conv.unreadCount) {
        if (typeof conv.unreadCount.get === 'function') {
          // It's a Map
          unreadCount = conv.unreadCount.get(userId) || 0;
        } else if (typeof conv.unreadCount === 'object') {
          // It's a plain object (from lean())
          unreadCount = conv.unreadCount[userId] || 0;
        }
      }
      
      return {
        id: conv._id.toString(),
        user: {
          id: otherUser._id.toString(),
          name: otherUser.name || 'Anonymous User',
          username: otherUser.username,
          avatar: otherUser.avatar || '',
          role: otherUser.role || 'USER'
        },
        lastMessage: conv.lastMessage ? {
          content: conv.lastMessage.content,
          timestamp: conv.lastMessage.timestamp,
          isOwnMessage: conv.lastMessage.senderId?._id.toString() === userId
        } : null,
        unreadCount: unreadCount,
        updatedAt: conv.updatedAt
      };
    });
    
    res.json({ conversations: formattedConversations });
  } catch (error) {
    logger.error('[Messages] Error fetching conversations:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

/**
 * GET /api/lms/conversations/:conversationId/messages
 * Get messages in a specific conversation
 */
router.get('/conversations/:conversationId/messages', requireJwtAuth, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;
    const { limit = 50, before } = req.query;
    
    // Verify user is participant in conversation
    const conversation = await DirectConversation.findById(conversationId);
    if (!conversation || !conversation.participants.includes(userId)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Build query
    const query = { conversationId };
    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }
    
    // Fetch messages
    const messages = await DirectMessage.find(query)
      .populate('sender', 'name username avatar')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .lean();
    
    // Format messages
    const formattedMessages = messages.map(msg => ({
      id: msg._id.toString(),
      content: msg.content,
      sender: {
        id: msg.sender._id.toString(),
        name: msg.sender.name,
        username: msg.sender.username,
        avatar: msg.sender.avatar || ''
      },
      isOwnMessage: msg.sender._id.toString() === userId,
      isRead: msg.isRead,
      createdAt: msg.createdAt,
      editedAt: msg.editedAt
    }));
    
    // Reverse to get chronological order
    formattedMessages.reverse();
    
    res.json({ messages: formattedMessages });
  } catch (error) {
    logger.error('[Messages] Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

/**
 * POST /api/lms/conversations
 * Start a new conversation or get existing one
 */
router.post('/conversations', requireJwtAuth, async (req, res) => {
  try {
    const { recipientId } = req.body;
    const userId = req.user.id;
    
    if (!recipientId) {
      return res.status(400).json({ error: 'Recipient ID required' });
    }
    
    if (recipientId === userId) {
      return res.status(400).json({ error: 'Cannot message yourself' });
    }
    
    // Check if recipient exists
    const User = getUserModel();
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ error: 'Recipient not found' });
    }
    
    // Find or create conversation
    const conversation = await DirectConversation.findOrCreate(userId, recipientId);
    
    // Populate and return
    await conversation.populate('participants', 'name username avatar role');
    
    const otherUser = conversation.participants.find(p => p._id.toString() !== userId);
    
    res.json({
      conversation: {
        id: conversation._id.toString(),
        user: {
          id: otherUser._id.toString(),
          name: otherUser.name || 'Anonymous User',
          username: otherUser.username,
          avatar: otherUser.avatar || '',
          role: otherUser.role || 'USER'
        },
        unreadCount: conversation.unreadCount?.get(userId) || 0
      }
    });
  } catch (error) {
    logger.error('[Messages] Error creating conversation:', error);
    res.status(500).json({ error: 'Failed to create conversation' });
  }
});

/**
 * POST /api/lms/conversations/:conversationId/messages
 * Send a new message
 */
router.post('/conversations/:conversationId/messages', requireJwtAuth, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;
    
    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Message content required' });
    }
    
    // Verify conversation exists and user is participant
    const conversation = await DirectConversation.findById(conversationId);
    if (!conversation || !conversation.participants.includes(userId)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Get recipient (the other participant)
    const recipientId = conversation.participants.find(p => p.toString() !== userId);
    
    // Create message
    const message = await DirectMessage.create({
      conversationId,
      sender: userId,
      recipient: recipientId,
      content: content.trim()
    });
    
    // Update conversation
    conversation.lastMessage = {
      content: content.trim().substring(0, 500),
      timestamp: message.createdAt,
      senderId: userId
    };
    
    // Increment unread count for recipient
    const currentUnread = conversation.unreadCount.get(recipientId.toString()) || 0;
    conversation.unreadCount.set(recipientId.toString(), currentUnread + 1);
    
    await conversation.save();
    
    // Populate and return message
    await message.populate('sender', 'name username avatar');
    
    res.json({
      message: {
        id: message._id.toString(),
        content: message.content,
        sender: {
          id: message.sender._id.toString(),
          name: message.sender.name,
          username: message.sender.username,
          avatar: message.sender.avatar || ''
        },
        isOwnMessage: true,
        isRead: false,
        createdAt: message.createdAt
      }
    });
  } catch (error) {
    logger.error('[Messages] Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

/**
 * PUT /api/lms/conversations/:conversationId/read
 * Mark conversation as read
 */
router.put('/conversations/:conversationId/read', requireJwtAuth, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;
    
    // Update conversation unread count
    const conversation = await DirectConversation.findById(conversationId);
    if (!conversation || !conversation.participants.includes(userId)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Reset unread count for current user
    conversation.unreadCount.set(userId.toString(), 0);
    await conversation.save();
    
    // Mark all messages as read
    await DirectMessage.updateMany(
      {
        conversationId,
        recipient: userId,
        isRead: false
      },
      {
        isRead: true
      }
    );
    
    res.json({ success: true });
  } catch (error) {
    logger.error('[Messages] Error marking as read:', error);
    res.status(500).json({ error: 'Failed to mark as read' });
  }
});

/**
 * PUT /api/lms/conversations/mark-all-read
 * Mark all conversations as read
 */
router.put('/conversations/mark-all-read', requireJwtAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Find all conversations for user
    const conversations = await DirectConversation.find({
      participants: userId
    });
    
    // Update each conversation
    for (const conv of conversations) {
      conv.unreadCount.set(userId.toString(), 0);
      await conv.save();
    }
    
    // Mark all messages as read
    await DirectMessage.updateMany(
      {
        recipient: userId,
        isRead: false
      },
      {
        isRead: true
      }
    );
    
    res.json({ success: true });
  } catch (error) {
    logger.error('[Messages] Error marking all as read:', error);
    res.status(500).json({ error: 'Failed to mark all as read' });
  }
});

module.exports = router;