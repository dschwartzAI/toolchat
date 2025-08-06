import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { cn } from '~/utils';
import {
  OGDialog,
  OGDialogContent,
  OGDialogTitle,
  Button,
  Input,
  Textarea,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '~/components/ui';
import { useLocalize } from '~/hooks';
import { useToastContext } from '~/Providers';
import { useCreateForumPostMutation, useGetForumCategoriesQuery } from '~/data-provider/Academy';

interface CreatePostProps {
  isOpen: boolean;
  onClose: () => void;
  categoryId?: string | null;
}

interface PostFormData {
  title: string;
  content: string;
  categoryId: string;
  tags: string;
}

export const CreatePost: React.FC<CreatePostProps> = ({ isOpen, onClose, categoryId }) => {
  const localize = useLocalize();
  const { showToast } = useToastContext();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: categories } = useGetForumCategoriesQuery();
  const createPost = useCreateForumPostMutation();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset
  } = useForm<PostFormData>({
    defaultValues: {
      title: '',
      content: '',
      categoryId: categoryId || '',
      tags: ''
    }
  });

  const onSubmit = async (data: PostFormData) => {
    setIsSubmitting(true);

    const tags = data.tags
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);

    createPost.mutate(
      {
        title: data.title,
        content: data.content,
        categoryId: data.categoryId,
        tags
      },
      {
        onSuccess: () => {
          showToast({
            message: localize('com_academy_post_created'),
            status: 'success'
          });
          reset();
          onClose();
        },
        onError: (error) => {
          showToast({
            message: localize('com_academy_post_create_error'),
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
    <OGDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <OGDialogContent className="max-w-2xl">
        <OGDialogTitle>
          <div className="flex items-center justify-between">
            <span>{localize('com_academy_create_post')}</span>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </OGDialogTitle>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
          {/* Title */}
          <div>
            <Label htmlFor="title">{localize('com_academy_post_title')}</Label>
            <Input
              id="title"
              {...register('title', {
                required: localize('com_academy_title_required'),
                maxLength: {
                  value: 200,
                  message: localize('com_academy_title_too_long')
                }
              })}
              placeholder={localize('com_academy_post_title_placeholder')}
              className="mt-1"
            />
            {errors.title && (
              <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>
            )}
          </div>

          {/* Category */}
          <div>
            <Label htmlFor="category">{localize('com_academy_category')}</Label>
            <Controller
              name="categoryId"
              control={control}
              rules={{ required: localize('com_academy_category_required') }}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder={localize('com_academy_select_category')} />
                  </SelectTrigger>
                  <SelectContent>
                    {categories?.map((category) => (
                      <SelectItem key={category._id} value={category._id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.categoryId && (
              <p className="text-red-500 text-sm mt-1">{errors.categoryId.message}</p>
            )}
          </div>

          {/* Content */}
          <div>
            <Label htmlFor="content">{localize('com_academy_post_content')}</Label>
            <Textarea
              id="content"
              {...register('content', {
                required: localize('com_academy_content_required'),
                minLength: {
                  value: 10,
                  message: localize('com_academy_content_too_short')
                }
              })}
              placeholder={localize('com_academy_post_content_placeholder')}
              className="mt-1 min-h-[200px]"
            />
            <p className="text-xs text-text-secondary mt-1">
              {localize('com_academy_markdown_supported')}
            </p>
            {errors.content && (
              <p className="text-red-500 text-sm mt-1">{errors.content.message}</p>
            )}
          </div>

          {/* Tags */}
          <div>
            <Label htmlFor="tags">{localize('com_academy_tags')}</Label>
            <Input
              id="tags"
              {...register('tags')}
              placeholder={localize('com_academy_tags_placeholder')}
              className="mt-1"
            />
            <p className="text-xs text-text-secondary mt-1">
              {localize('com_academy_tags_help')}
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              {localize('com_ui_cancel')}
            </Button>
            <Button type="submit" variant="submit" disabled={isSubmitting}>
              {isSubmitting ? localize('com_ui_saving') : localize('com_academy_create_post')}
            </Button>
          </div>
        </form>
      </OGDialogContent>
    </OGDialog>
  );
};

export default CreatePost;