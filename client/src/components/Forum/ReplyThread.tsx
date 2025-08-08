import React, { useState } from 'react';
import { ThumbsUp, MessageCircle, MoreVertical, Edit, Trash, Flag, History } from 'lucide-react';
import { SystemRoles } from 'librechat-data-provider';
import { cn } from '~/utils';
import { Button, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '~/components/ui';
import CreateReply from './CreateReply';
import EditReply from './EditReply';
import { useLocalize, useAuthContext } from '~/hooks';
import { useLikeReplyMutation, useDeleteReplyMutation } from '~/data-provider/Academy';
import { useToastContext } from '~/Providers';
import { formatDistanceToNow } from '~/utils/formatDate';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { ForumReply } from '~/data-provider/Academy/types';

interface ReplyThreadProps {
  reply: ForumReply;
  postId: string;
  depth?: number;
  isEditing?: boolean;
  onEdit?: () => void;
  onCancelEdit?: () => void;
  className?: string;
}

export const ReplyThread: React.FC<ReplyThreadProps> = ({
  reply,
  postId,
  depth = 0,
  isEditing = false,
  onEdit,
  onCancelEdit,
  className
}) => {
  const localize = useLocalize();
  const { user } = useAuthContext();
  const { showToast } = useToastContext();
  
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [showReplies, setShowReplies] = useState(true);
  const [showEditHistory, setShowEditHistory] = useState(false);

  const likeReply = useLikeReplyMutation();
  const deleteReply = useDeleteReplyMutation();

  const isAuthor = user?._id === reply.author._id;
  const isAdmin = user?.role === SystemRoles.ADMIN;
  const hasLiked = reply.likedBy?.includes(user?._id || '');
  const canNest = depth < 3; // Limit nesting depth
  const canModerate = isAuthor || isAdmin;

  const handleLike = () => {
    likeReply.mutate(
      { replyId: reply._id },
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
    if (!window.confirm(localize('com_academy_confirm_delete_reply'))) return;

    deleteReply.mutate(
      reply._id,
      {
        onSuccess: () => {
          showToast({
            message: localize('com_academy_reply_deleted'),
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

  return (
    <div className={cn('', className)}>
      <div className={cn('flex gap-3', depth > 0 && 'ml-12')}>
        {/* Author avatar */}
        <div className="flex-shrink-0">
          {reply.author.avatar ? (
            <img
              src={reply.author.avatar}
              alt={reply.author.name}
              className="h-8 w-8 rounded-full"
            />
          ) : (
            <div className="h-8 w-8 rounded-full bg-surface-tertiary flex items-center justify-center">
              <span className="text-sm font-medium">{reply.author.name[0]}</span>
            </div>
          )}
        </div>

        {/* Reply content */}
        <div className="flex-1">
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium">{reply.author.name}</span>
              <span className="text-text-secondary">·</span>
              <span className="text-text-secondary">{formatDistanceToNow(reply.createdAt)}</span>
              {reply.isEdited && (
                <>
                  <span className="text-text-secondary">·</span>
                  <span className="text-text-secondary text-xs">{localize('com_ui_edited')}</span>
                </>
              )}
            </div>

            {canModerate && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {isAuthor && (
                    <>
                      <DropdownMenuItem onClick={onEdit}>
                        <Edit className="h-4 w-4 mr-2" />
                        {localize('com_ui_edit')}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                        <Trash className="h-4 w-4 mr-2" />
                        {localize('com_ui_delete')}
                      </DropdownMenuItem>
                    </>
                  )}
                  
                  {reply.editHistory && reply.editHistory.length > 0 && (
                    <>
                      {isAuthor && <DropdownMenuSeparator />}
                      <DropdownMenuItem onClick={() => setShowEditHistory(true)}>
                        <History className="h-4 w-4 mr-2" />
                        {localize('com_academy_view_edit_history')}
                      </DropdownMenuItem>
                    </>
                  )}
                  
                  {isAdmin && !isAuthor && (
                    <>
                      {reply.editHistory?.length > 0 && <DropdownMenuSeparator />}
                      <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                        <Trash className="h-4 w-4 mr-2" />
                        {localize('com_ui_delete')}
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Flag className="h-4 w-4 mr-2" />
                        {localize('com_academy_flag_inappropriate')}
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Content */}
          {isEditing ? (
            <EditReply
              reply={reply}
              onSuccess={onCancelEdit}
              onCancel={onCancelEdit}
            />
          ) : (
            <>
              <div className="prose prose-sm dark:prose-invert max-w-none mb-3">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {reply.content}
                </ReactMarkdown>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLike}
                  disabled={likeReply.isLoading}
                  className={cn('gap-1 px-2 h-8', hasLiked && 'text-blue-600')}
                >
                  <ThumbsUp className={cn('h-4 w-4', hasLiked && 'fill-current')} />
                  <span className="text-xs">{reply.likeCount || 0}</span>
                </Button>

                {canNest && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowReplyForm(!showReplyForm)}
                    className="gap-1 px-2 h-8"
                  >
                    <MessageCircle className="h-4 w-4" />
                    <span className="text-xs">{localize('com_academy_reply')}</span>
                  </Button>
                )}

                {reply.replies && reply.replies.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowReplies(!showReplies)}
                    className="text-xs px-2 h-8"
                  >
                    {showReplies
                      ? localize('com_academy_hide_replies')
                      : `${localize('com_academy_show_replies')} (${reply.replies.length})`}
                  </Button>
                )}
              </div>

              {/* Nested reply form */}
              {showReplyForm && (
                <div className="mt-3">
                  <CreateReply
                    postId={postId}
                    parentReplyId={reply._id}
                    onSuccess={() => setShowReplyForm(false)}
                    onCancel={() => setShowReplyForm(false)}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Nested replies */}
      {showReplies && reply.replies && reply.replies.length > 0 && (
        <div className="mt-4 space-y-4">
          {reply.replies.map((nestedReply) => (
            <ReplyThread
              key={nestedReply._id}
              reply={nestedReply}
              postId={postId}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ReplyThread;