import React, { useState, useMemo, useCallback } from 'react';
import { Search, Users, AlertCircle } from 'lucide-react';
import { useGetMembers } from '~/data-provider/Academy/membersQueries';
import type { Member } from '~/data-provider/Academy/membersQueries';
import MemberCard from './MemberCard';
import ChatModal from './ChatModal';
import { useDebounce } from '~/hooks';

const MembersTab: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const { members, loading, error } = useGetMembers();
  
  // Debounce search query by 300ms
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Filter members based on search query
  const filteredMembers = useMemo(() => {
    if (!debouncedSearchQuery.trim()) {
      return members;
    }

    const query = debouncedSearchQuery.toLowerCase().trim();
    
    return members.filter(member => {
      const searchableFields = [
        member.name,
        member.username,
        member.bio,
        member.location
      ].filter(Boolean).map(field => field!.toLowerCase());

      return searchableFields.some(field => field.includes(query));
    });
  }, [members, debouncedSearchQuery]);

  const handleChat = useCallback((member: Member) => {
    setSelectedMember(member);
  }, []);

  const handleCloseChat = useCallback(() => {
    setSelectedMember(null);
  }, []);

  // Loading state with skeletons
  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-semibold mb-4">Community Members</h2>
          <div className="relative">
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-7xl mx-auto">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-start gap-3 mb-3">
                  <div className="h-12 w-12 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
                  <div className="flex-1">
                    <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2 animate-pulse" />
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 animate-pulse" />
                  </div>
                </div>
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mb-3 animate-pulse" />
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
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
      {/* Header with search */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-2xl font-semibold mb-4">Community Members</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, username, bio, or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          {filteredMembers.length} {filteredMembers.length === 1 ? 'member' : 'members'}
          {debouncedSearchQuery && ` matching "${debouncedSearchQuery}"`}
        </div>
      </div>

      {/* Members grid */}
      <div className="flex-1 overflow-y-auto p-6">
        {filteredMembers.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-7xl mx-auto">
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
      {selectedMember && (
        <ChatModal
          isOpen={true}
          onClose={handleCloseChat}
          member={selectedMember}
        />
      )}
    </div>
  );
};

export default MembersTab;