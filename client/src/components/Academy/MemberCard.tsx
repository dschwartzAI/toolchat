import React from 'react';
import { MapPin, MessageCircle, Shield, Briefcase } from 'lucide-react';
import type { Member } from '~/data-provider/Academy/membersQueries';

interface MemberCardProps {
  member: Member;
  onChat: (member: Member) => void;
}

const MemberCard: React.FC<MemberCardProps> = ({ member, onChat }) => {
  const isAdmin = (member.role || '').toUpperCase() === 'ADMIN';
  
  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 hover:shadow-md transition-all">
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {member.avatarUrl ? (
            <img
              src={member.avatarUrl}
              alt={member.name}
              className="h-10 w-10 rounded-full object-cover"
            />
          ) : (
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-semibold">
              {member.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* Info - optimized for horizontal space */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
              {member.name}
            </h3>
            {isAdmin && (
              <div className="flex items-center gap-0.5 flex-shrink-0">
                <Shield className="h-3 w-3 text-purple-600 dark:text-purple-400" />
                <span className="text-xs font-medium text-purple-700 dark:text-purple-300">Admin</span>
              </div>
            )}
          </div>
          
          {/* Secondary info in one line */}
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {member.jobTitle && (
              <div className="flex items-center gap-1 truncate">
                <Briefcase className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">{member.jobTitle}</span>
              </div>
            )}
            {member.location && (
              <div className="flex items-center gap-1 truncate">
                <MapPin className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">{member.location}</span>
              </div>
            )}
            {!member.jobTitle && !member.location && member.bio && (
              <span className="truncate italic">{member.bio}</span>
            )}
          </div>
        </div>

        {/* Chat Button - compact */}
        <button
          onClick={() => onChat(member)}
          className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-md bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium transition-colors"
          aria-label={`Chat with ${member.name}`}
        >
          <MessageCircle className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Chat</span>
        </button>
      </div>
    </div>
  );
};

export default MemberCard;