import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ThumbsUp, MessageCircle, Eye, MoreVertical, Flag, Edit, Trash } from 'lucide-react';
import { cn } from '~/utils';
import { Button, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '~/components/ui';
import { Spinner } from '~/components/svg';
import ReplyThread from './ReplyThread';
import CreateReply from './CreateReply';
import { useLocalize, useAuthContext } from '~/hooks';
import { useGetForumPostQuery, useLikePostMutation, useDeletePostMutation } from '~/data-provider/Academy';
import { useToastContext } from '~/Providers';
import { formatDistanceToNow } from '~/utils/formatDate';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export const PostViewer: React.FC = () => {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const localize = useLocalize();
  const { user } = useAuthContext();
  const { showToast } = useToastContext();
  
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [editingReplyId, setEditingReplyId] = useState<string | null>(null);

  const { data: post, isLoading, error } = useGetForumPostQuery(postId || '');
  const likePost = useLikePostMutation();
  const deletePost = useDeletePostMutation();

  const handleLike = () => {
    if (!post) return;
    
    likePost.mutate(
      { postId: post._id },
      {
        onError: () => {
          showToast({
            message: localize('com_academy_like_error'),
            status: 'error'
          });
        }
      }
    );
  };

  const handleDelete = () => {
    if (!post || !window.confirm(localize('com_academy_confirm_delete_post'))) return;

    deletePost.mutate(
      { postId: post._id },
      {
        onSuccess: () => {
          navigate('/academy/forum');
          showToast({
            message: localize('com_academy_post_deleted'),
            status: 'success'
          });
        },
        onError: () => {
          showToast({
            message: localize('com_academy_delete_error'),
            status: 'error'
          });
        }
      }
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <p className="text-red-500 mb-4">{localize('com_academy_post_not_found')}</p>
        <Button onClick={() => navigate('/academy/forum')} variant="outline">
          {localize('com_academy_back_to_forum')}
        </Button>
      </div>
    );
  }

  const isAuthor = user?._id === post.author._id;
  const hasLiked = post.likedBy?.includes(user?._id || '');

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/academy/forum')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {localize('com_academy_back_to_forum')}
          </Button>

          <div className="flex items-start justify-between gap-4">
            <h1 className="text-3xl font-bold text-text-primary">{post.title}</h1>
            
            {isAuthor && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => navigate(`/academy/forum/posts/${post._id}/edit`)}>
                    <Edit className="h-4 w-4 mr-2" />
                    {localize('com_ui_edit')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                    <Trash className="h-4 w-4 mr-2" />
                    {localize('com_ui_delete')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Post metadata */}
          <div className="flex items-center gap-4 mt-4">
            <div className="flex items-center gap-2">
              {post.author.avatar ? (
                <img
                  src={post.author.avatar}
                  alt={post.author.name}
                  className="h-8 w-8 rounded-full"
                />
              ) : (
                <div className="h-8 w-8 rounded-full bg-surface-tertiary flex items-center justify-center">
                  <span className="text-sm font-medium">{post.author.name[0]}</span>
                </div>
              )}
              <span className="font-medium">{post.author.name}</span>
            </div>
            <span className="text-text-secondary">·</span>
            <span className="text-text-secondary">{formatDistanceToNow(post.createdAt)}</span>
            {post.category && (
              <>
                <span className="text-text-secondary">·</span>
                <span className="px-2 py-0.5 bg-surface-tertiary rounded text-sm">
                  {post.category.name}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Post content */}
        <div className="prose prose-lg dark:prose-invert max-w-none mb-8">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {post.content}
          </ReactMarkdown>
        </div>

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex gap-2 mb-6">
            {post.tags.map((tag, index) => (
              <span
                key={index}
                className="text-sm bg-surface-secondary px-3 py-1 rounded-full"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-4 pb-6 border-b border-border-light">
          <Button
            variant={hasLiked ? 'default' : 'outline'}
            size="sm"
            onClick={handleLike}
            disabled={likePost.isLoading}
            className="gap-2"
          >
            <ThumbsUp className={cn('h-4 w-4', hasLiked && 'fill-current')} />
            {post.likeCount || 0}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowReplyForm(!showReplyForm)}
            className="gap-2"
          >
            <MessageCircle className="h-4 w-4" />
            {localize('com_academy_reply')}
          </Button>

          <div className="flex items-center gap-1 text-sm text-text-secondary ml-auto">
            <Eye className="h-4 w-4" />
            <span>{post.viewCount || 0} {localize('com_academy_views')}</span>
          </div>
        </div>

        {/* Reply form */}
        {showReplyForm && (
          <div className="mt-6">
            <CreateReply
              postId={post._id}
              onSuccess={() => setShowReplyForm(false)}
            />
          </div>
        )}

        {/* Replies */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-text-primary mb-6">
            {post.replyCount || 0} {localize('com_academy_replies')}
          </h2>
          
          {post.replies && post.replies.length > 0 ? (
            <div className="space-y-4">
              {post.replies.map((reply) => (
                <ReplyThread
                  key={reply._id}
                  reply={reply}
                  postId={post._id}
                  isEditing={editingReplyId === reply._id}
                  onEdit={() => setEditingReplyId(reply._id)}
                  onCancelEdit={() => setEditingReplyId(null)}
                />
              ))}
            </div>
          ) : (
            <p className="text-text-secondary text-center py-8">
              {localize('com_academy_no_replies')}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default PostViewer;