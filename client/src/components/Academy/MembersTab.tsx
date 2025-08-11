import React, { useState, useMemo, useCallback } from 'react';
import { Search, Users, AlertCircle } from 'lucide-react';
import { useGetMembers } from '~/data-provider/Academy/membersQueries';
import type { Member } from '~/data-provider/Academy/membersQueries';
import MemberCard from './MemberCard';
import ConversationModal from './EnhancedConversationModal';
import { useDebounce } from '~/hooks';
import type { Conversation } from './ChatsTab';

const MembersTab: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const { members, loading, error } = useGetMembers();
  
  // Debounce search query by 300ms
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Filter and sort members based on search query and role
  const filteredMembers = useMemo(() => {
    let filtered = members;
    
    // Apply search filter if query exists
    if (debouncedSearchQuery.trim()) {
      const query = debouncedSearchQuery.toLowerCase().trim();
      
      filtered = members.filter(member => {
        const searchableFields = [
          member.name,
          member.username,
          member.bio,
          member.location
        ].filter(Boolean).map(field => field!.toLowerCase());

        return searchableFields.some(field => field.includes(query));
      });
    }
    
    // Sort to show admins first (handle uppercase roles from DB)
    return filtered.sort((a, b) => {
      const roleA = (a.role || '').toUpperCase();
      const roleB = (b.role || '').toUpperCase();
      
      // Admins come first
      if (roleA === 'ADMIN' && roleB !== 'ADMIN') return -1;
      if (roleA !== 'ADMIN' && roleB === 'ADMIN') return 1;
      // Otherwise maintain original order
      return 0;
    });
  }, [members, debouncedSearchQuery]);

  const handleChat = useCallback((member: Member) => {
    setSelectedMember(member);
  }, []);

  const handleCloseChat = useCallback(() => {
    setSelectedMember(null);
  }, []);

  // Convert member to conversation format for the modal
  const selectedConversation: Conversation | null = selectedMember ? {
    id: '', // Will be created when first message is sent
    user: {
      id: selectedMember.id,
      name: selectedMember.name,
      username: selectedMember.username,
      avatar: selectedMember.avatarUrl,
      role: selectedMember.role
    },
    lastMessage: null,
    unreadCount: 0,
    updatedAt: new Date().toISOString()
  } : null;

  // Loading state with skeletons
  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Community Members</h2>
          </div>
          <div className="relative">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <div className="flex flex-col gap-3 max-w-3xl mx-auto">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="rounded-lg border border-gray-200 dark:border-gray-700 p-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-2 animate-pulse" />
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-48 animate-pulse" />
                  </div>
                  <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse flex-shrink-0" />
                </div>
              </div>
            ))}
          </div>
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
          Failed to load members
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {error}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Compact header with search */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Community Members</h2>
          <span className="text-xs text-gray-600 dark:text-gray-400">
            {filteredMembers.length} {filteredMembers.length === 1 ? 'member' : 'members'}
          </span>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search members..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Members list - single column for better space usage */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredMembers.length > 0 ? (
          <div className="flex flex-col gap-3 max-w-3xl mx-auto">
            {filteredMembers.map((member) => (
              <MemberCard
                key={member.id}
                member={member}
                onChat={handleChat}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Users className="h-12 w-12 text-gray-400 mb-3" />
            <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
              No members found
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {debouncedSearchQuery 
                ? `No members match "${debouncedSearchQuery}"`
                : 'No members available'}
            </p>
          </div>
        )}
      </div>

      {/* Chat Modal */}
      {selectedConversation && (
        <ConversationModal
          isOpen={true}
          onClose={handleCloseChat}
          conversation={selectedConversation}
        />
      )}
    </div>
  );
};

export default MembersTab;