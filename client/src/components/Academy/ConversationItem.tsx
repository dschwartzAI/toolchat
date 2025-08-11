import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import type { Conversation } from './ChatsTab';

interface ConversationItemProps {
  conversation: Conversation;
  onClick: () => void;
}

const ConversationItem: React.FC<ConversationItemProps> = ({ conversation, onClick }) => {
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) {
      // Today - show time
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    } else if (diffInDays < 7) {
      // Within a week - show "Xd"
      return `${diffInDays}d`;
    } else if (diffInDays < 30) {
      // Within a month - show date
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    } else {
      // Older - show month and year
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        year: 'numeric' 
      });
    }
  };
  
  return (
    <div
      onClick={onClick}
      className="relative flex items-start gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors"
    >
      {/* Avatar */}
      <div className="flex-shrink-0">
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
      
      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">
            {conversation.user.name}
            {conversation.unreadCount > 0 && (
              <span className="ml-2 text-gray-500 dark:text-gray-400">
                ({conversation.unreadCount})
              </span>
            )}
          </h3>
          {conversation.lastMessage && (
            <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
              {formatTime(conversation.lastMessage.timestamp)}
            </span>
          )}
        </div>
        
        {conversation.lastMessage && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 truncate">
            {conversation.lastMessage.isOwnMessage && (
              <span className="text-gray-500">You: </span>
            )}
            {conversation.lastMessage.content}
          </p>
        )}
      </div>
      
      {/* Unread indicator */}
      {conversation.unreadCount > 0 && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2">
          <div className="h-2 w-2 rounded-full bg-blue-500" />
        </div>
      )}
    </div>
  );
};

export default ConversationItem;