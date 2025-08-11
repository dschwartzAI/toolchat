import React from 'react';
import { MapPin, MessageCircle } from 'lucide-react';
import type { Member } from '~/data-provider/Academy/membersQueries';

interface MemberCardProps {
  member: Member;
  onChat: (member: Member) => void;
}

const MemberCard: React.FC<MemberCardProps> = ({ member, onChat }) => {
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm hover:shadow-lg transition-all">
      <div className="flex flex-col gap-4">
        {/* Avatar and Name */}
        <div className="flex items-start gap-4">
          {member.avatarUrl ? (
            <img
              src={member.avatarUrl}
              alt={member.name}
              className="h-16 w-16 rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xl font-semibold flex-shrink-0">
              {member.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 leading-tight">
              {member.name}
            </h3>
            {member.jobTitle && (
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                {member.jobTitle}
              </p>
            )}
          </div>
        </div>

        {/* Bio */}
        {member.bio && (
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
            {member.bio}
          </p>
        )}

        {/* Company and Location */}
        <div className="flex flex-wrap gap-3 text-sm">
          {member.company && (
            <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
              <span className="font-medium">Company:</span>
              <span>{member.company}</span>
            </div>
          )}
          {member.location && (
            <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
              <MapPin className="h-3 w-3" />
              <span>{member.location}</span>
            </div>
          )}
        </div>

        {/* Chat Button */}
        <button
          onClick={() => onChat(member)}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-medium transition-colors"
          aria-label={`Chat with ${member.name}`}
        >
          <MessageCircle className="h-4 w-4" />
          Start Chat
        </button>
      </div>
    </div>
  );
};

export default MemberCard;