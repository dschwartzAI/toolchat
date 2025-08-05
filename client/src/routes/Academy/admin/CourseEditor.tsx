import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Plus, Trash, GripVertical } from 'lucide-react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { DragDropContext, Droppable, Draggable } from '~/mocks/hello-pangea-dnd';
import { cn } from '~/utils';
import { Button, Input, Textarea, Label, Switch } from '~/components/ui';
import { Spinner } from '~/components/svg';
import { useLocalize } from '~/hooks';
import { useToastContext } from '~/Providers';
import {
  useGetCourseQuery,
  useCreateCourseMutation,
  useUpdateCourseMutation
} from '~/data-provider/Academy';
import ModuleEditor from './ModuleEditor';
import type { Course } from '~/data-provider/Academy/types';

interface CourseFormData {
  title: string;
  description: string;
  thumbnail?: string;
  tags: string;
  isPublished: boolean;
  modules: Array<{
    title: string;
    description?: string;
    order: number;
    lessons: Array<{
      title: string;
      description?: string;
      type: 'video' | 'text';
      content?: string;
      videoUrl?: string;
      duration?: number;
      order: number;
      isLocked: boolean;
    }>;
  }>;
}

export default function CourseEditor() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const localize = useLocalize();
  const { showToast } = useToastContext();
  const isEditMode = !!courseId;

  const { data: course, isLoading } = useGetCourseQuery(courseId || '', {
    enabled: isEditMode
  });

  const createCourse = useCreateCourseMutation();
  const updateCourse = useUpdateCourseMutation();

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty }
  } = useForm<CourseFormData>({
    defaultValues: {
      title: '',
      description: '',
      thumbnail: '',
      tags: '',
      isPublished: false,
      modules: []
    }
  });

  const { fields: modules, append: appendModule, remove: removeModule, move: moveModule } = useFieldArray({
    control,
    name: 'modules'
  });

  useEffect(() => {
    if (course) {
      reset({
        title: course.title,
        description: course.description,
        thumbnail: course.thumbnail,
        tags: course.tags?.join(', ') || '',
        isPublished: course.isPublished,
        modules: course.modules.map(module => ({
          title: module.title,
          description: module.description,
          order: module.order,
          lessons: module.lessons.map(lesson => ({
            title: lesson.title,
            description: lesson.description,
            type: lesson.type,
            content: lesson.content,
            videoUrl: lesson.videoUrl,
            duration: lesson.duration,
            order: lesson.order,
            isLocked: lesson.isLocked
          }))
        }))
      });
    }
  }, [course, reset]);

  const onSubmit = async (data: CourseFormData) => {
    const courseData = {
      ...data,
      tags: data.tags.split(',').map(tag => tag.trim()).filter(Boolean),
      modules: data.modules.map((module, index) => ({
        ...module,
        order: index,
        lessons: module.lessons.map((lesson, lessonIndex) => ({
          ...lesson,
          order: lessonIndex
        }))
      }))
    };

    const mutation = isEditMode ? updateCourse : createCourse;
    const mutationData = isEditMode 
      ? { courseId: courseId!, updates: courseData }
      : courseData;

    mutation.mutate(mutationData as any, {
      onSuccess: () => {
        showToast({
          message: isEditMode 
            ? localize('com_academy_course_updated')
            : localize('com_academy_course_created'),
          status: 'success'
        });
        navigate('/academy/admin/courses');
      },
      onError: (error) => {
        showToast({
          message: localize('com_academy_save_error'),
          status: 'error'
        });
      }
    });
  };

  const handleAddModule = () => {
    appendModule({
      title: '',
      description: '',
      order: modules.length,
      lessons: []
    });
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    moveModule(result.source.index, result.destination.index);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <form onSubmit={handleSubmit(onSubmit)} className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => navigate('/academy/admin/courses')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {localize('com_ui_back')}
            </Button>
            <h1 className="text-2xl font-bold text-text-primary">
              {isEditMode ? localize('com_academy_edit_course') : localize('com_academy_create_course')}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="submit"
              variant="submit"
              disabled={!isDirty}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              {localize('com_ui_save')}
            </Button>
          </div>
        </div>

        {/* Course Details */}
        <div className="bg-surface-secondary rounded-lg p-6 mb-6 space-y-4">
          <h2 className="text-lg font-semibold text-text-primary mb-4">
            {localize('com_academy_course_details')}
          </h2>

          <div>
            <Label htmlFor="title">{localize('com_academy_course_title')}</Label>
            <Input
              id="title"
              {...register('title', {
                required: localize('com_academy_title_required'),
                maxLength: {
                  value: 200,
                  message: localize('com_academy_title_too_long')
                }
              })}
              placeholder={localize('com_academy_course_title_placeholder')}
              className="mt-1"
            />
            {errors.title && (
              <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="description">{localize('com_academy_description')}</Label>
            <Textarea
              id="description"
              {...register('description', {
                required: localize('com_academy_description_required')
              })}
              placeholder={localize('com_academy_course_description_placeholder')}
              className="mt-1 min-h-[100px]"
            />
            {errors.description && (
              <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="thumbnail">{localize('com_academy_thumbnail_url')}</Label>
            <Input
              id="thumbnail"
              {...register('thumbnail')}
              placeholder="https://example.com/thumbnail.jpg"
              className="mt-1"
            />
          </div>

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

          <div className="flex items-center justify-between">
            <Label htmlFor="isPublished">{localize('com_academy_publish_course')}</Label>
            <Controller
              name="isPublished"
              control={control}
              render={({ field }) => (
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
          </div>
        </div>

        {/* Modules */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-text-primary">
              {localize('com_academy_modules')}
            </h2>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddModule}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              {localize('com_academy_add_module')}
            </Button>
          </div>

          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="modules">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                  {modules.map((module, index) => (
                    <Draggable key={module.id} draggableId={module.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={cn(
                            'bg-surface-secondary rounded-lg',
                            snapshot.isDragging && 'shadow-lg'
                          )}
                        >
                          <ModuleEditor
                            moduleIndex={index}
                            control={control}
                            register={register}
                            errors={errors}
                            onRemove={() => removeModule(index)}
                            dragHandleProps={provided.dragHandleProps}
                          />
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>

          {modules.length === 0 && (
            <div className="text-center py-12 bg-surface-secondary rounded-lg">
              <p className="text-text-secondary mb-4">
                {localize('com_academy_no_modules')}
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={handleAddModule}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                {localize('com_academy_add_first_module')}
              </Button>
            </div>
          )}
        </div>
      </form>
    </div>
  );
}