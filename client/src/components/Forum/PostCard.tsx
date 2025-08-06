import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, ThumbsUp, Eye, Clock, User, Edit, Trash, MoreVertical, Pin, Lock } from 'lucide-react';
import { SystemRoles } from 'librechat-data-provider';
import { cn } from '~/utils';
import { useLocalize, useAuthContext } from '~/hooks';
import { formatDistanceToNow } from '~/utils/formatDate';
import { useDeletePostMutation, usePinPostMutation, useLockPostMutation } from '~/data-provider/Academy';
import { Button, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '~/components/ui';
import { useToastContext } from '~/Providers';
import type { ForumPost } from '~/data-provider/Academy/types';

interface PostCardProps {
  post: ForumPost;
  className?: string;
}

export const PostCard: React.FC<PostCardProps> = ({ post, className }) => {
  const navigate = useNavigate();
  const localize = useLocalize();
  const { user } = useAuthContext();
  const { showToast } = useToastContext();
  
  const deletePostMutation = useDeletePostMutation();
  const pinPostMutation = usePinPostMutation();
  const lockPostMutation = useLockPostMutation();
  
  const isAuthor = user?._id === post.author._id || user?.id === post.author._id;
  const isAdmin = user?.role === SystemRoles.ADMIN;
  const canModerate = isAuthor || isAdmin;

  const handleClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on the dropdown menu
    if ((e.target as HTMLElement).closest('.dropdown-trigger')) {
      return;
    }
    navigate(`/academy/forum/posts/${post._id}`);
  };
  
  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/academy/forum/posts/${post._id}/edit`);
  };
  
  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(localize('com_academy_confirm_delete_post'))) {
      try {
        await deletePostMutation.mutateAsync(post._id);
        showToast({ message: localize('com_academy_post_deleted'), status: 'success' });
      } catch (error) {
        showToast({ message: localize('com_academy_delete_failed'), status: 'error' });
      }
    }
  };
  
  const handlePin = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await pinPostMutation.mutateAsync(post._id);
      showToast({ 
        message: post.isPinned ? localize('com_academy_post_unpinned') : localize('com_academy_post_pinned'), 
        status: 'success' 
      });
    } catch (error) {
      showToast({ message: localize('com_academy_action_failed'), status: 'error' });
    }
  };
  
  const handleLock = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await lockPostMutation.mutateAsync(post._id);
      showToast({ 
        message: post.isLocked ? localize('com_academy_post_unlocked') : localize('com_academy_post_locked'), 
        status: 'success' 
      });
    } catch (error) {
      showToast({ message: localize('com_academy_action_failed'), status: 'error' });
    }
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        'p-4 border-b border-border-light hover:bg-surface-hover cursor-pointer transition-colors',
        className
      )}
    >
      <div className="flex gap-4">
        {/* Author avatar */}
        <div className="flex-shrink-0">
          {post.author.avatar ? (
            <img
              src={post.author.avatar}
              alt={post.author.name}
              className="h-10 w-10 rounded-full"
            />
          ) : (
            <div className="h-10 w-10 rounded-full bg-surface-tertiary flex items-center justify-center">
              <User className="h-5 w-5 text-text-secondary" />
            </div>
          )}
        </div>

        {/* Post content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4 mb-1">
            <h3 className="text-lg font-semibold text-text-primary line-clamp-2 hover:text-blue-600">
              {post.title}
            </h3>
            <div className="flex items-center gap-2">
              {post.isPinned && (
                <span className="flex-shrink-0 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-1 rounded">
                  {localize('com_academy_pinned')}
                </span>
              )}
              {post.isLocked && (
                <span className="flex-shrink-0 text-xs bg-gray-100 dark:bg-gray-900/30 text-gray-600 dark:text-gray-400 px-2 py-1 rounded">
                  {localize('com_academy_locked')}
                </span>
              )}
              {canModerate && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild className="dropdown-trigger">
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {isAuthor && (
                      <>
                        <DropdownMenuItem onClick={handleEdit}>
                          <Edit className="h-4 w-4 mr-2" />
                          {localize('com_ui_edit')}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                          <Trash className="h-4 w-4 mr-2" />
                          {localize('com_ui_delete')}
                        </DropdownMenuItem>
                      </>
                    )}
                    {isAdmin && (
                      <>
                        {isAuthor && <DropdownMenuSeparator />}
                        <DropdownMenuItem onClick={handlePin}>
                          <Pin className="h-4 w-4 mr-2" />
                          {post.isPinned ? localize('com_academy_unpin') : localize('com_academy_pin')}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleLock}>
                          <Lock className="h-4 w-4 mr-2" />
                          {post.isLocked ? localize('com_academy_unlock') : localize('com_academy_lock')}
                        </DropdownMenuItem>
                        {!isAuthor && (
                          <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                            <Trash className="h-4 w-4 mr-2" />
                            {localize('com_ui_delete')}
                          </DropdownMenuItem>
                        )}
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>

          <p className="text-text-secondary line-clamp-2 mb-3">{post.content}</p>

          <div className="flex items-center gap-4 text-sm text-text-secondary">
            <div className="flex items-center gap-1">
              <span className="font-medium">{post.author.name}</span>
              <span>·</span>
              <Clock className="h-3.5 w-3.5" />
              <span>{formatDistanceToNow(post.createdAt)}</span>
            </div>

            {post.category && (
              <span className="px-2 py-0.5 bg-surface-tertiary rounded text-xs">
                {post.category.name}
              </span>
            )}

            <div className="flex items-center gap-3 ml-auto">
              <div className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                <span>{post.viewCount || 0}</span>
              </div>
              <div className="flex items-center gap-1">
                <MessageCircle className="h-4 w-4" />
                <span>{post.replyCount || 0}</span>
              </div>
              <div className="flex items-center gap-1">
                <ThumbsUp className="h-4 w-4" />
                <span>{post.likeCount || 0}</span>
              </div>
            </div>
          </div>

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex gap-2 mt-2">
              {post.tags.slice(0, 3).map((tag, index) => (
                <span
                  key={index}
                  className="text-xs bg-surface-secondary px-2 py-0.5 rounded"
                >
                  #{tag}
                </span>
              ))}
              {post.tags.length > 3 && (
                <span className="text-xs text-text-secondary">
                  +{post.tags.length - 3} {localize('com_academy_more')}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PostCard;