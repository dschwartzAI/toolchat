import React from 'react';
import { Trash, GripVertical, Video, FileText, Lock } from 'lucide-react';
import { Control, UseFormRegister, FieldErrors, Controller } from 'react-hook-form';
import { cn } from '~/utils';
import { Button, Input, Textarea, Label, Switch, SelectDropDown } from '~/components/ui';
import { useLocalize } from '~/hooks';

interface LessonEditorProps {
  moduleIndex: number;
  lessonIndex: number;
  control: Control<any>;
  register: UseFormRegister<any>;
  errors: FieldErrors<any>;
  onRemove: () => void;
  dragHandleProps?: any;
}

export default function LessonEditor({
  moduleIndex,
  lessonIndex,
  control,
  register,
  errors,
  onRemove,
  dragHandleProps
}: LessonEditorProps) {
  const localize = useLocalize();
  const [isExpanded, setIsExpanded] = React.useState(false);

  const lessonType = control._formValues?.modules?.[moduleIndex]?.lessons?.[lessonIndex]?.type || 'video';

  return (
    <div className="bg-surface-primary border border-border-light rounded-lg p-3">
      <div className="flex items-start gap-3">
        <div {...dragHandleProps} className="mt-1 cursor-move">
          <GripVertical className="h-4 w-4 text-text-secondary" />
        </div>

        <div className="flex-1 space-y-3">
          {/* Title and Controls */}
          <div className="flex items-center gap-2">
            <div className="flex-shrink-0">
              {lessonType === 'video' ? (
                <Video className="h-4 w-4 text-blue-600" />
              ) : (
                <FileText className="h-4 w-4 text-green-600" />
              )}
            </div>

            <Input
              {...register(`modules.${moduleIndex}.lessons.${lessonIndex}.title`, {
                required: localize('com_academy_lesson_title_required')
              })}
              placeholder={localize('com_academy_lesson_title_placeholder')}
              className="flex-1"
              onFocus={() => setIsExpanded(true)}
            />

            <Controller
              name={`modules.${moduleIndex}.lessons.${lessonIndex}.isLocked`}
              control={control}
              render={({ field }) => (
                <button
                  type="button"
                  onClick={() => field.onChange(!field.value)}
                  className={cn(
                    'p-1 rounded',
                    field.value ? 'text-yellow-600' : 'text-text-secondary'
                  )}
                  title={localize('com_academy_lock_lesson')}
                >
                  <Lock className="h-4 w-4" />
                </button>
              )}
            />

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onRemove}
              className="h-8 w-8 text-red-600 hover:text-red-700"
            >
              <Trash className="h-4 w-4" />
            </Button>
          </div>

          {errors.modules?.[moduleIndex]?.lessons?.[lessonIndex]?.title && (
            <p className="text-red-500 text-sm">
              {errors.modules[moduleIndex].lessons[lessonIndex].title.message}
            </p>
          )}

          {/* Expanded Content */}
          {isExpanded && (
            <div className="space-y-3 pl-7">
              {/* Lesson Type */}
              <div>
                <Label>{localize('com_academy_lesson_type')}</Label>
                <Controller
                  name={`modules.${moduleIndex}.lessons.${lessonIndex}.type`}
                  control={control}
                  render={({ field }) => (
                    <SelectDropDown
                      value={field.value}
                      setValue={field.onChange}
                      options={[
                        { 
                          value: 'video', 
                          label: localize('com_academy_video'),
                          icon: <Video className="h-4 w-4" />
                        },
                        { 
                          value: 'text', 
                          label: localize('com_academy_article'),
                          icon: <FileText className="h-4 w-4" />
                        }
                      ]}
                      className="mt-1"
                    />
                  )}
                />
              </div>

              {/* Description */}
              <div>
                <Label>{localize('com_academy_lesson_description')}</Label>
                <Textarea
                  {...register(`modules.${moduleIndex}.lessons.${lessonIndex}.description`)}
                  placeholder={localize('com_academy_lesson_description_placeholder')}
                  className="mt-1"
                  rows={2}
                />
              </div>

              {/* Video URL (for video lessons) */}
              {lessonType === 'video' && (
                <>
                  <div>
                    <Label>{localize('com_academy_video_url')}</Label>
                    <Input
                      {...register(`modules.${moduleIndex}.lessons.${lessonIndex}.videoUrl`, {
                        required: lessonType === 'video' ? localize('com_academy_video_url_required') : false
                      })}
                      placeholder="https://youtube.com/watch?v=... or https://vimeo.com/..."
                      className="mt-1"
                    />
                    {errors.modules?.[moduleIndex]?.lessons?.[lessonIndex]?.videoUrl && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.modules[moduleIndex].lessons[lessonIndex].videoUrl.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label>{localize('com_academy_duration_minutes')}</Label>
                    <Input
                      type="number"
                      {...register(`modules.${moduleIndex}.lessons.${lessonIndex}.duration`, {
                        valueAsNumber: true,
                        min: { value: 0, message: localize('com_academy_duration_positive') }
                      })}
                      placeholder="15"
                      className="mt-1"
                    />
                  </div>
                </>
              )}

              {/* Content (for text lessons) */}
              {lessonType === 'text' && (
                <div>
                  <Label>{localize('com_academy_lesson_content')}</Label>
                  <Textarea
                    {...register(`modules.${moduleIndex}.lessons.${lessonIndex}.content`, {
                      required: lessonType === 'text' ? localize('com_academy_content_required') : false
                    })}
                    placeholder={localize('com_academy_lesson_content_placeholder')}
                    className="mt-1 min-h-[200px]"
                  />
                  <p className="text-xs text-text-secondary mt-1">
                    {localize('com_academy_markdown_supported')}
                  </p>
                  {errors.modules?.[moduleIndex]?.lessons?.[lessonIndex]?.content && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.modules[moduleIndex].lessons[lessonIndex].content.message}
                    </p>
                  )}
                </div>
              )}

              <button
                type="button"
                onClick={() => setIsExpanded(false)}
                className="text-sm text-blue-600 hover:underline"
              >
                {localize('com_ui_collapse')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}