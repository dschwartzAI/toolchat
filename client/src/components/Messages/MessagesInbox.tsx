import React from 'react';
import { X } from 'lucide-react';
import ChatsTab from '../Academy/ChatsTab';

interface MessagesInboxProps {
  isOpen: boolean;
  onClose: () => void;
}

const MessagesInbox: React.FC<MessagesInboxProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Inbox Panel */}
      <div className="fixed right-0 top-0 bottom-0 z-40 w-[400px] bg-surface-primary shadow-2xl">
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border-light px-4 py-3">
            <h2 className="text-lg font-semibold">Messages</h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-surface-hover rounded-lg transition-colors"
              aria-label="Close Messages"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          {/* Chats content */}
          <div className="flex-1 overflow-hidden">
            <ChatsTab />
          </div>
        </div>
      </div>
    </>
  );
};

export default MessagesInbox;