import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, MessageSquare, MoreVertical, Reply } from 'lucide-react';
import { useGetForumPostQuery, useCreateForumReplyMutation, useLikePostMutation, useLikeReplyMutation } from '~/data-provider';
import { useLocalize, useAuthContext } from '~/hooks';
import { cn } from '~/utils';

export default function ForumPost() {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const localize = useLocalize();
  const { user } = useAuthContext();
  
  const [replyContent, setReplyContent] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [showReplyForm, setShowReplyForm] = useState(false);

  const { data: post, isLoading } = useGetForumPostQuery(postId || '');
  const createReplyMutation = useCreateForumReplyMutation();
  const likePostMutation = useLikePostMutation();
  const likeReplyMutation = useLikeReplyMutation();

  const handleReply = () => {
    if (!replyContent.trim()) return;

    createReplyMutation.mutate(
      {
        postId: postId!,
        content: replyContent,
        parentReplyId: replyingTo
      },
      {
        onSuccess: () => {
          setReplyContent('');
          setReplyingTo(null);
          setShowReplyForm(false);
        }
      }
    );
  };

  const handleLikePost = () => {
    likePostMutation.mutate({ postId: postId! });
  };

  const handleLikeReply = (replyId: string) => {
    likeReplyMutation.mutate({ replyId });
  };

  const renderReplies = (replies: any[], depth = 0) => {
    return replies.map((reply) => (
      <div key={reply._id} className={cn("border-l-2 border-border-light", depth > 0 && "ml-4")}>
        <div className="p-4">
          <div className="flex items-start gap-3">
            <img
              src={reply.author.avatar || '/default-avatar.png'}
              alt={reply.author.name}
              className="w-8 h-8 rounded-full"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium">{reply.author.name}</span>
                <span className="text-sm text-text-tertiary">
                  {new Date(reply.createdAt).toLocaleDateString()}
                </span>
              </div>
              
              <div className="text-text-secondary mb-3">{reply.content}</div>
              
              <div className="flex items-center gap-4 text-sm">
                <button
                  onClick={() => handleLikeReply(reply._id)}
                  className={cn(
                    "flex items-center gap-1 transition-colors",
                    reply.isLiked ? "text-red-500" : "text-text-tertiary hover:text-red-500"
                  )}
                >
                  <Heart className="w-4 h-4" fill={reply.isLiked ? "currentColor" : "none"} />
                  <span>{reply.likeCount}</span>
                </button>
                
                <button
                  onClick={() => {
                    setReplyingTo(reply._id);
                    setShowReplyForm(true);
                  }}
                  className="flex items-center gap-1 text-text-tertiary hover:text-text-primary transition-colors"
                >
                  <Reply className="w-4 h-4" />
                  Reply
                </button>
              </div>
              
              {reply.replies && reply.replies.length > 0 && (
                <div className="mt-4">
                  {renderReplies(reply.replies, depth + 1)}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    ));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Post Not Found</h2>
          <button
            onClick={() => navigate('/academy/forum')}
            className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
          >
            Back to Forum
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto p-8">
        {/* Header */}
        <button
          onClick={() => navigate('/academy/forum')}
          className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Forum
        </button>

        {/* Post */}
        <div className="bg-surface-secondary rounded-lg p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start gap-4">
              <img
                src={post.author.avatar || '/default-avatar.png'}
                alt={post.author.name}
                className="w-12 h-12 rounded-full"
              />
              <div>
                <h1 className="text-2xl font-bold mb-2">{post.title}</h1>
                <div className="flex items-center gap-2 text-sm text-text-tertiary">
                  <span className="font-medium">{post.author.name}</span>
                  <span>•</span>
                  <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                  <span>•</span>
                  <span>{post.viewCount} views</span>
                </div>
              </div>
            </div>
            
            <button className="p-2 hover:bg-surface-hover rounded-lg transition-colors">
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>
          
          <div className="prose prose-lg dark:prose-invert max-w-none mb-4">
            {post.content}
          </div>
          
          <div className="flex items-center gap-4 pt-4 border-t border-border-light">
            <button
              onClick={handleLikePost}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg transition-colors",
                post.isLiked 
                  ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400" 
                  : "bg-surface-tertiary hover:bg-surface-hover"
              )}
            >
              <Heart className="w-4 h-4" fill={post.isLiked ? "currentColor" : "none"} />
              <span>{post.likeCount} Likes</span>
            </button>
            
            <button
              onClick={() => setShowReplyForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-surface-tertiary rounded-lg hover:bg-surface-hover transition-colors"
            >
              <MessageSquare className="w-4 h-4" />
              Reply
            </button>
          </div>
        </div>

        {/* Reply Form */}
        {showReplyForm && (
          <div className="bg-surface-secondary rounded-lg p-4 mb-6">
            <h3 className="font-medium mb-3">
              {replyingTo ? 'Reply to comment' : 'Add a reply'}
            </h3>
            <textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Share your thoughts..."
              className="w-full p-3 bg-surface-primary rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-green-500"
              rows={4}
            />
            <div className="flex justify-end gap-2 mt-3">
              <button
                onClick={() => {
                  setShowReplyForm(false);
                  setReplyingTo(null);
                  setReplyContent('');
                }}
                className="px-4 py-2 text-text-secondary hover:text-text-primary transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReply}
                disabled={!replyContent.trim()}
                className={cn(
                  "px-4 py-2 rounded-lg font-medium transition-colors",
                  replyContent.trim()
                    ? "bg-green-500 text-white hover:bg-green-600"
                    : "bg-surface-tertiary text-text-tertiary cursor-not-allowed"
                )}
              >
                Post Reply
              </button>
            </div>
          </div>
        )}

        {/* Replies */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold mb-4">
            {post.replies?.length || 0} Replies
          </h2>
          {post.replies && renderReplies(post.replies)}
        </div>
      </div>
    </div>
  );
}