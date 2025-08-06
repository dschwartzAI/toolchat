import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { cn } from '~/utils';
import { Button, Textarea } from '~/components/ui';
import { useLocalize, useAuthContext } from '~/hooks';
import { useToastContext } from '~/Providers';
import { useCreateForumReplyMutation } from '~/data-provider/Academy';

interface CreateReplyProps {
  postId: string;
  parentReplyId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
  className?: string;
}

interface ReplyFormData {
  content: string;
}

export const CreateReply: React.FC<CreateReplyProps> = ({
  postId,
  parentReplyId,
  onSuccess,
  onCancel,
  className
}) => {
  const localize = useLocalize();
  const { user } = useAuthContext();
  const { showToast } = useToastContext();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createReply = useCreateForumReplyMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<ReplyFormData>({
    defaultValues: {
      content: ''
    }
  });

  const onSubmit = async (data: ReplyFormData) => {
    setIsSubmitting(true);

    createReply.mutate(
      {
        postId,
        content: data.content,
        parentReplyId
      },
      {
        onSuccess: () => {
          showToast({
            message: localize('com_academy_reply_posted'),
            status: 'success'
          });
          reset();
          if (onSuccess) {
            onSuccess();
          }
        },
        onError: (error) => {
          showToast({
            message: localize('com_academy_reply_error'),
            status: 'error'
          });
        },
        onSettled: () => {
          setIsSubmitting(false);
        }
      }
    );
  };

  return (
    <div className={cn('bg-surface-secondary rounded-lg p-4', className)}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="flex items-start gap-3">
          {/* User avatar */}
          {user?.avatar ? (
            <img
              src={user.avatar}
              alt={user.name || ''}
              className="h-8 w-8 rounded-full flex-shrink-0"
            />
          ) : (
            <div className="h-8 w-8 rounded-full bg-surface-tertiary flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-medium">{user?.name?.[0] || 'U'}</span>
            </div>
          )}

          {/* Reply form */}
          <div className="flex-1">
            <Textarea
              {...register('content', {
                required: localize('com_academy_reply_required'),
                minLength: {
                  value: 5,
                  message: localize('com_academy_reply_too_short')
                }
              })}
              placeholder={
                parentReplyId
                  ? localize('com_academy_write_nested_reply')
                  : localize('com_academy_write_reply')
              }
              className="min-h-[100px]"
            />
            {errors.content && (
              <p className="text-red-500 text-sm mt-1">{errors.content.message}</p>
            )}

            <div className="flex justify-end gap-2 mt-3">
              {onCancel && (
                <Button type="button" variant="outline" size="sm" onClick={onCancel}>
                  {localize('com_ui_cancel')}
                </Button>
              )}
              <Button type="submit" variant="submit" size="sm" disabled={isSubmitting}>
                {isSubmitting ? localize('com_ui_saving') : localize('com_academy_post_reply')}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CreateReply;