import React, { useState, useEffect, useMemo } from 'react';
import { Search, MessageCircle, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { useDebounce } from '~/hooks';
import ConversationItem from './ConversationItem';
import ConversationModal from './EnhancedConversationModal';

export interface Conversation {
  id: string;
  user: {
    id: string;
    name: string;
    username?: string;
    avatar: string;
    role?: string;
  };
  lastMessage: {
    content: string;
    timestamp: string;
    isOwnMessage: boolean;
  } | null;
  unreadCount: number;
  updatedAt: string;
}

const ChatsTab: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Debounce search query by 300ms
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  
  // Fetch conversations
  useEffect(() => {
    fetchConversations();
  }, []);
  
  const fetchConversations = async () => {
    try {
      setLoading(true);
      
      const response = await axios.get('/api/lms/messages/conversations');
      
      setConversations(response.data.conversations || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching conversations:', err);
      setError(err instanceof Error ? err.message : 'Failed to load conversations');
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };
  
  // Filter conversations based on search query
  const filteredConversations = useMemo(() => {
    if (!debouncedSearchQuery.trim()) {
      return conversations;
    }
    
    const query = debouncedSearchQuery.toLowerCase().trim();
    
    return conversations.filter(conv => {
      const searchableFields = [
        conv.user.name,
        conv.user.username,
        conv.lastMessage?.content
      ].filter(Boolean).map(field => field!.toLowerCase());
      
      return searchableFields.some(field => field.includes(query));
    });
  }, [conversations, debouncedSearchQuery]);
  
  // Calculate total unread count
  const totalUnread = useMemo(() => {
    return conversations.reduce((sum, conv) => sum + conv.unreadCount, 0);
  }, [conversations]);
  
  const handleMarkAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/lms/messages/conversations/mark-all-read', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      
      if (response.ok) {
        // Update local state
        setConversations(prevConvs => 
          prevConvs.map(conv => ({ ...conv, unreadCount: 0 }))
        );
      }
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };
  
  const handleConversationClick = (conversation: Conversation) => {
    setSelectedConversation(conversation);
  };
  
  const handleCloseModal = () => {
    setSelectedConversation(null);
    // Refresh conversations to update read status
    fetchConversations();
  };
  
  const handleNewMessage = (newMessageContent?: string) => {
    // Update the conversation locally with the new message
    if (selectedConversation && newMessageContent) {
      const updatedConversation = {
        ...selectedConversation,
        lastMessage: {
          content: newMessageContent,
          timestamp: new Date().toISOString(),
          isOwnMessage: true
        },
        updatedAt: new Date().toISOString()
      };
      
      // Update the selected conversation to prevent modal refresh
      setSelectedConversation(updatedConversation);
      
      // Update the conversations list
      setConversations(prevConvs => 
        prevConvs.map(conv => {
          if (conv.id === selectedConversation.id) {
            return updatedConversation;
          }
          return conv;
        })
      );
    }
    // Don't fetch conversations here - it causes a modal refresh
  };
  
  // Loading state with skeletons
  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold">Chats</h2>
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse" />
          </div>
          <div className="relative">
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="p-4 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-start gap-3">
                <div className="h-12 w-12 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
                <div className="flex-1">
                  <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2 animate-pulse" />
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4">
        <AlertCircle className="h-12 w-12 text-red-500 mb-3" />
        <p className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">
          Failed to load chats
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {error}
        </p>
        <button
          onClick={fetchConversations}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col h-full">
      {/* Header with search */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold">Chats</h2>
          {totalUnread > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="text-sm text-blue-500 hover:text-blue-600 font-medium"
            >
              Mark all as read
            </button>
          )}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search users"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>
      
      {/* Conversations list */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length > 0 ? (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {filteredConversations.map((conversation) => (
              <ConversationItem
                key={conversation.id}
                conversation={conversation}
                onClick={() => handleConversationClick(conversation)}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <MessageCircle className="h-12 w-12 text-gray-400 mb-3" />
            <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
              {debouncedSearchQuery ? 'No conversations found' : 'No messages yet'}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {debouncedSearchQuery 
                ? `No conversations match "${debouncedSearchQuery}"`
                : 'Start a conversation from the Members tab'}
            </p>
          </div>
        )}
      </div>
      
      {/* Conversation Modal */}
      {selectedConversation && (
        <ConversationModal
          isOpen={true}
          onClose={handleCloseModal}
          conversation={selectedConversation}
          onNewMessage={handleNewMessage}
        />
      )}
    </div>
  );
};

export default ChatsTab;