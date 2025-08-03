import React, { useEffect } from 'react';
import { QueryKeys } from 'librechat-data-provider';
import { useForm } from 'react-hook-form';
import { useQueryClient } from '@tanstack/react-query';
import type { TConversationTag, TConversationTagRequest } from 'librechat-data-provider';
import { Label, Input } from '~/components';
import { useTagContext } from '~/Providers/TagContext';
import { useConversationTagMutation } from '~/data-provider';
import { useToastContext } from '~/Providers';
import { useLocalize } from '~/hooks';
import { logger } from '~/utils';

type TTagFormProps = {
  tags?: string[];
  tag?: TConversationTag;
  conversationId?: string;
  formRef: React.RefObject<HTMLFormElement>;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  mutation: ReturnType<typeof useConversationTagMutation>;
};

const TagForm = ({
  tags,
  tag,
  mutation,
  conversationId,
  setOpen,
  formRef,
}: TTagFormProps) => {
  const localize = useLocalize();
  const queryClient = useQueryClient();
  const { showToast } = useToastContext();
  const { tags: allTags } = useTagContext();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<TConversationTagRequest>({
    defaultValues: {
      tag: tag?.tag ?? '',
      description: '',
      conversationId: conversationId ?? '',
      addToConversation: true, // Always add to current conversation
    },
  });

  useEffect(() => {
    if (tag && tag.tag) {
      setValue('tag', tag.tag);
    }
  }, [tag, setValue]);

  const onSubmit = (data: TConversationTagRequest) => {
    logger.log('tag_mutation', 'TagForm - onSubmit: data', data);
    if (mutation.isLoading) {
      return;
    }
    
    // Check if tag already exists in current conversation
    if (data.tag != null && (tags ?? []).includes(data.tag)) {
      showToast({
        message: localize('com_ui_tags_create_exists'),
        status: 'warning',
      });
      return;
    }
    
    // Check if tag exists in all tags
    const existingTags =
      queryClient.getQueryData<TConversationTag[]>([QueryKeys.conversationTags]) ?? [];
    if (!tag && existingTags.some((t) => t.tag === data.tag)) {
      showToast({
        message: localize('com_ui_tags_create_exists'),
        status: 'warning',
      });
      return;
    }

    mutation.mutate(data);
    setOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit(onSubmit)();
    }
  };

  return (
    <form
      ref={formRef}
      className="mt-6"
      aria-label="Tag form"
      method="POST"
      onSubmit={handleSubmit(onSubmit)}
    >
      <div className="flex w-full flex-col items-center gap-2">
        <div className="grid w-full items-center gap-2">
          <Label htmlFor="tag-input" className="text-left text-sm font-medium">
            {localize('com_ui_tags_title')}
          </Label>
          <Input
            type="text"
            id="tag-input"
            aria-label="Tag"
            autoFocus
            {...register('tag', {
              required: localize('com_ui_tags_title') + ' is required',
              maxLength: {
                value: 128,
                message: 'Maximum 128 characters',
              },
              validate: (value) => {
                return (
                  value === tag?.tag ||
                  allTags.every((t) => t.tag !== value) ||
                  localize('com_ui_tags_create_exists')
                );
              },
            })}
            aria-invalid={!!errors.tag}
            placeholder={localize('com_ui_tags_new')}
            onKeyDown={handleKeyDown}
          />
          {errors.tag && <span className="text-sm text-red-500">{errors.tag.message}</span>}
        </div>
      </div>
    </form>
  );
};

export default TagForm;