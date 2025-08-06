import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button, Textarea } from '~/components/ui';
import { useLocalize } from '~/hooks';
import { useToastContext } from '~/Providers';
import { useUpdateForumReplyMutation } from '~/data-provider/Academy';
import type { ForumReply } from '~/data-provider/Academy/types';

interface EditReplyProps {
  reply: ForumReply;
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface ReplyFormData {
  content: string;
}

export const EditReply: React.FC<EditReplyProps> = ({ reply, onSuccess, onCancel }) => {
  const localize = useLocalize();
  const { showToast } = useToastContext();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateReply = useUpdateForumReplyMutation();

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<ReplyFormData>({
    defaultValues: {
      content: reply.content
    }
  });

  const onSubmit = async (data: ReplyFormData) => {
    setIsSubmitting(true);

    updateReply.mutate(
      {
        replyId: reply._id,
        content: data.content
      },
      {
        onSuccess: () => {
          showToast({
            message: localize('com_academy_reply_updated'),
            status: 'success'
          });
          if (onSuccess) {
            onSuccess();
          }
        },
        onError: (error) => {
          showToast({
            message: localize('com_academy_update_error'),
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <Textarea
        {...register('content', {
          required: localize('com_academy_reply_required'),
          minLength: {
            value: 5,
            message: localize('com_academy_reply_too_short')
          }
        })}
        className="min-h-[100px]"
      />
      {errors.content && (
        <p className="text-red-500 text-sm">{errors.content.message}</p>
      )}

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          {localize('com_ui_cancel')}
        </Button>
        <Button type="submit" variant="submit" size="sm" disabled={isSubmitting}>
          {isSubmitting ? localize('com_ui_saving') : localize('com_ui_save')}
        </Button>
      </div>
    </form>
  );
};

export default EditReply;