import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Send, Smile } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import axios from 'axios';
import type { Conversation } from './ChatsTab';

interface Message {
  id: string;
  content: string;
  sender: {
    id: string;
    name: string;
    username?: string;
    avatar: string;
  };
  isOwnMessage: boolean;
  isRead: boolean;
  createdAt: string;
  editedAt?: string;
}

interface ConversationModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversation: Conversation;
  onNewMessage?: (messageContent?: string) => void;
}

const ConversationModal: React.FC<ConversationModalProps> = ({ 
  isOpen, 
  onClose, 
  conversation,
  onNewMessage 
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Get conversation ID from starting a new conversation
  const [conversationId, setConversationId] = useState(conversation.id);
  
  // Close on ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
    }
    
    return () => {
      document.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose]);
  
  // Load messages when modal opens
  useEffect(() => {
    if (isOpen && conversationId) {
      loadMessages();
      markAsRead();
    }
  }, [isOpen, conversationId]);
  
  // If no conversation ID, create one
  useEffect(() => {
    if (isOpen && !conversationId) {
      createConversation();
    }
  }, [isOpen, conversationId]);
  
  const createConversation = async () => {
    try {
      const response = await axios.post('/api/lms/messages/conversations', {
        recipientId: conversation.user.id
      });
      
      setConversationId(response.data.conversation.id);
    } catch (error) {
      console.error('Error creating conversation:', error);
    }
  };
  
  const loadMessages = async () => {
    try {
      setLoading(true);
      
      const response = await axios.get(`/api/lms/messages/conversations/${conversationId}/messages`);
      
      setMessages(response.data.messages || []);
      scrollToBottom();
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const markAsRead = async () => {
    try {
      await axios.put(`/api/lms/messages/conversations/${conversationId}/read`);
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  const handleSendMessage = async () => {
    if (!newMessage.trim() || sending || !conversationId) return;
    
    const messageContent = newMessage.trim();
    
    try {
      setSending(true);
      
      // Optimistically add the message to the UI
      const optimisticMessage: Message = {
        id: `temp-${Date.now()}`,
        content: messageContent,
        sender: {
          id: 'current-user',
          name: 'You',
          username: '',
          avatar: ''
        },
        isOwnMessage: true,
        isRead: true,
        createdAt: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, optimisticMessage]);
      setNewMessage('');
      scrollToBottom();
      
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
      
      // Send the actual message
      const response = await axios.post(`/api/lms/messages/conversations/${conversationId}/messages`, {
        content: messageContent
      });
      
      // Replace optimistic message with real one
      setMessages(prev => prev.map(msg => 
        msg.id === optimisticMessage.id ? response.data.message : msg
      ));
      
      // Update parent component with new message content
      onNewMessage?.(messageContent);
      
    } catch (error) {
      console.error('Error sending message:', error);
      // Remove optimistic message on error
      setMessages(prev => prev.filter(msg => !msg.id.startsWith('temp-')));
      // Re-add the message to the input
      setNewMessage(messageContent);
    } finally {
      setSending(false);
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value);
    
    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  };
  
  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };
  
  const formatDateSeparator = (timestamp: string) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'long', 
        day: 'numeric',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
      });
    }
  };
  
  // Group messages by date
  const groupedMessages = messages.reduce((groups, message) => {
    const date = new Date(message.createdAt).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {} as Record<string, Message[]>);
  
  if (!isOpen) return null;
  
  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-2xl h-[70vh] -translate-x-1/2 -translate-y-1/2">
        <div className="h-full rounded-2xl bg-white dark:bg-gray-800 shadow-2xl overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center gap-3">
              {conversation.user.avatar ? (
                <img
                  src={conversation.user.avatar}
                  alt={conversation.user.name}
                  className="h-10 w-10 rounded-full object-cover"
                />
              ) : (
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                  {conversation.user.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                  {conversation.user.name}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Active recently
                </p>
              </div>
            </div>
            <div className="flex items-center">
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                aria-label="Close chat"
              >
                <X className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
          </div>
          
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {loading ? (
              <div className="flex justify-center items-center h-full">
                <div className="text-gray-500 dark:text-gray-400">Loading messages...</div>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="flex justify-center gap-4 mb-4">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center text-white font-semibold">
                    You
                  </div>
                  {conversation.user.avatar ? (
                    <img
                      src={conversation.user.avatar}
                      alt={conversation.user.name}
                      className="h-12 w-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                      {conversation.user.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <p className="text-gray-600 dark:text-gray-400">
                  You're about to break the ice with {conversation.user.name.split(' ')[0]}!
                </p>
              </div>
            ) : (
              Object.entries(groupedMessages).map(([date, dateMessages]) => (
                <div key={date}>
                  <div className="flex justify-center mb-4">
                    <span className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full">
                      {formatDateSeparator(dateMessages[0].createdAt)}
                    </span>
                  </div>
                  {dateMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex gap-3 mb-4 ${message.isOwnMessage ? 'flex-row-reverse' : ''}`}
                    >
                      <div className="flex-shrink-0">
                        {message.sender.avatar ? (
                          <img
                            src={message.sender.avatar}
                            alt={message.sender.name}
                            className="h-8 w-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-semibold">
                            {message.sender.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className={`flex flex-col ${message.isOwnMessage ? 'items-end' : ''}`}>
                        <div className="flex items-baseline gap-2 mb-1">
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {message.sender.name}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {formatMessageTime(message.createdAt)}
                          </span>
                        </div>
                        <div
                          className={`max-w-md px-4 py-2 rounded-2xl ${
                            message.isOwnMessage
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words">{message.content}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
          
          {/* Message input */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-3">
            <div className="flex items-end gap-2">
              <textarea
                ref={textareaRef}
                value={newMessage}
                onChange={handleTextareaChange}
                onKeyDown={handleKeyDown}
                placeholder={`Message ${conversation.user.name.split(' ')[0]}...`}
                className="flex-1 resize-none rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                rows={1}
                style={{ minHeight: '38px', maxHeight: '120px' }}
                disabled={!conversationId}
              />
              <button
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                aria-label="Add emoji"
                disabled
              >
                <Smile className="h-5 w-5 text-gray-400" />
              </button>
              <button
                onClick={handleSendMessage}
                className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                disabled={!newMessage.trim() || sending || !conversationId}
                aria-label="Send message"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ConversationModal;