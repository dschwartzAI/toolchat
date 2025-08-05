import React, { useState } from 'react';
import { ThumbsUp, MessageSquare, Send, CornerDownRight } from 'lucide-react';
import { cn } from '~/utils';

interface Comment {
  _id: string;
  content: string;
  author: {
    name: string;
    avatar?: string;
  };
  createdAt: string;
  likeCount: number;
  isLiked?: boolean;
  parentId?: string;
  replies?: Comment[];
}

interface PostPreviewProps {
  post: {
    _id: string;
    title: string;
    content: string;
    author: {
      name: string;
      avatar?: string;
    };
    category: {
      name: string;
    };
    likeCount: number;
    replyCount: number;
    createdAt: string;
    isLiked?: boolean;
    comments?: Comment[];
  };
  isExpanded: boolean;
  onToggleExpand: () => void;
  onLike: () => void;
  onAddComment?: (content: string, parentId?: string) => void;
  onLikeComment?: (commentId: string) => void;
}

const PostPreview: React.FC<PostPreviewProps> = ({ 
  post, 
  isExpanded, 
  onToggleExpand, 
  onLike,
  onAddComment,
  onLikeComment 
}) => {
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replyingToAuthor, setReplyingToAuthor] = useState<string>('');

  const timeAgo = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(date).toLocaleDateString();
  };

  const getContentPreview = () => {
    const lines = post.content.split('\n').filter(line => line.trim());
    if (isExpanded) return post.content;
    return lines.slice(0, 2).join('\n');
  };

  const handleSubmitComment = () => {
    if (newComment.trim() && onAddComment) {
      onAddComment(newComment);
      setNewComment('');
    }
  };

  const handleSubmitReply = (parentId: string) => {
    if (replyText.trim() && onAddComment) {
      onAddComment(replyText, parentId);
      setReplyText('');
      setReplyingTo(null);
    }
  };

  const renderComment = (comment: Comment, depth: number = 0, parentAuthor?: string) => {
    const isReplyingToThis = replyingTo === comment._id;
    const shouldIndent = depth > 0 && depth <= 1; // Only indent first level of replies
    
    return (
      <div key={comment._id} className={cn("group", shouldIndent && "ml-8")}>
        <div className="bg-surface-primary rounded-lg p-3 mb-2">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-start gap-2">
              <img
                src={comment.author.avatar || '/default-avatar.png'}
                alt={comment.author.name}
                className="w-5 h-5 rounded-full mt-0.5"
              />
              <div>
                <div className="text-sm font-medium text-text-primary">
                  {comment.author.name}
                </div>
                <div className="text-xs text-text-tertiary">
                  {timeAgo(comment.createdAt)}
                </div>
              </div>
            </div>
          </div>
          <p className="text-sm text-text-secondary mb-2 whitespace-pre-wrap">
            {depth > 1 && parentAuthor && (
              <span className="text-green-500 font-medium">@{parentAuthor} </span>
            )}
            {comment.content}
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => onLikeComment?.(comment._id)}
              className={cn(
                "flex items-center gap-1 text-xs transition-colors",
                comment.isLiked ? "text-green-500" : "text-text-tertiary hover:text-text-secondary"
              )}
            >
              <ThumbsUp className="w-3 h-3" />
              <span>{comment.likeCount}</span>
            </button>
            <button
              onClick={() => {
                if (depth >= 1) {
                  // For deep replies, find the parent comment at depth 1
                  const parentCommentId = findParentAtDepth1(comment._id);
                  setReplyingTo(parentCommentId);
                  setReplyingToAuthor(comment.author.name);
                  setReplyText(`@${comment.author.name} `);
                } else {
                  setReplyingTo(comment._id);
                  setReplyingToAuthor('');
                  setReplyText('');
                }
              }}
              className="text-xs text-text-tertiary hover:text-text-primary transition-colors"
            >
              Reply
            </button>
          </div>
        </div>

        {/* Reply input for this comment - only show if we're at depth 0 or 1 */}
        {isReplyingToThis && depth < 2 && (
          <div className={cn("mb-3 flex gap-2", shouldIndent && "ml-8")}>
            <CornerDownRight className="w-4 h-4 text-text-tertiary mt-2 flex-shrink-0" />
            <div className="flex-1 flex gap-2">
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSubmitReply(comment._id)}
                placeholder={`Reply to ${comment.author.name}...`}
                className="flex-1 px-3 py-2 bg-surface-secondary rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                autoFocus
              />
              <button
                onClick={() => handleSubmitReply(comment._id)}
                disabled={!replyText.trim()}
                className={cn(
                  "p-2 rounded-lg transition-colors",
                  replyText.trim()
                    ? "bg-green-500 text-white hover:bg-green-600"
                    : "bg-surface-hover text-text-tertiary cursor-not-allowed"
                )}
              >
                <Send className="w-4 h-4" />
              </button>
              <button
                onClick={() => setReplyingTo(null)}
                className="p-2 text-text-tertiary hover:text-text-primary transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Nested replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="space-y-2">
            {comment.replies.map((reply) => renderComment(reply, depth + 1, comment.author.name))}
          </div>
        )}
      </div>
    );
  };

  // Helper to track comment hierarchy
  const commentHierarchy = new Map<string, string>(); // commentId -> parentId at depth 1

  // Organize comments into threads
  const organizeComments = (comments: Comment[] = []) => {
    const rootComments = comments.filter(c => !c.parentId);
    const commentMap = new Map<string, Comment[]>();
    
    comments.forEach(comment => {
      if (comment.parentId) {
        const siblings = commentMap.get(comment.parentId) || [];
        siblings.push(comment);
        commentMap.set(comment.parentId, siblings);
      }
    });

    const attachReplies = (comment: Comment, rootParentId?: string): Comment => {
      const replies = commentMap.get(comment._id) || [];
      
      // Track hierarchy for finding parent at depth 1
      if (rootParentId) {
        replies.forEach(reply => {
          commentHierarchy.set(reply._id, rootParentId);
        });
      } else {
        // This is a root comment
        replies.forEach(reply => {
          commentHierarchy.set(reply._id, comment._id);
        });
      }
      
      return {
        ...comment,
        replies: replies.map(r => attachReplies(r, rootParentId || comment._id))
      };
    };

    return rootComments.map(c => attachReplies(c));
  };

  // Helper function to find parent at depth 1
  const findParentAtDepth1 = (commentId: string): string => {
    return commentHierarchy.get(commentId) || commentId;
  };

  const threadedComments = organizeComments(post.comments);

  return (
    <div className="bg-surface-secondary rounded-lg mb-3 overflow-hidden">
      <div 
        className="p-4 hover:bg-surface-hover transition-colors cursor-pointer"
        onClick={onToggleExpand}
      >
        {/* Author */}
        <div className="flex items-center gap-2 mb-1">
          <img
            src={post.author.avatar || '/default-avatar.png'}
            alt={post.author.name}
            className="w-6 h-6 rounded-full"
          />
          <div className="text-sm text-text-primary">
            {post.author.name}
          </div>
        </div>
        
        {/* Category and timestamp */}
        <div className="text-xs text-text-tertiary mb-2">
          {post.category.name} • {timeAgo(post.createdAt)}
        </div>
        
        {/* Title */}
        <h3 className="font-bold text-text-primary mb-2">
          {post.title}
        </h3>
        
        {/* Content preview */}
        <p className={cn(
          "text-sm text-text-secondary mb-3 whitespace-pre-wrap",
          !isExpanded && "line-clamp-2"
        )}>
          {getContentPreview()}
        </p>
        
        {/* Actions */}
        <div className="flex items-center gap-4">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onLike();
            }}
            className={cn(
              "flex items-center gap-1 text-sm transition-colors",
              post.isLiked ? "text-green-500" : "text-text-tertiary hover:text-text-secondary"
            )}
          >
            <ThumbsUp className="w-4 h-4" />
            <span>{post.likeCount}</span>
          </button>
          
          <div className="flex items-center gap-1 text-sm text-text-tertiary">
            <MessageSquare className="w-4 h-4" />
            <span>{post.replyCount}</span>
          </div>
        </div>
      </div>

      {/* Comments section - only show when expanded */}
      {isExpanded && (
        <div className="border-t border-border-light">
          {/* Comments list */}
          {threadedComments.length > 0 && (
            <div className="p-4 space-y-2">
              {threadedComments.map((comment) => renderComment(comment))}
            </div>
          )}

          {/* Comment input at bottom */}
          <div className="p-4 border-t border-border-light bg-surface-primary">
            <div className="flex gap-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSubmitComment()}
                placeholder="Write a comment..."
                className="flex-1 px-3 py-2 bg-surface-secondary rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <button
                onClick={handleSubmitComment}
                disabled={!newComment.trim()}
                className={cn(
                  "p-2 rounded-lg transition-colors",
                  newComment.trim()
                    ? "bg-green-500 text-white hover:bg-green-600"
                    : "bg-surface-hover text-text-tertiary cursor-not-allowed"
                )}
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostPreview;