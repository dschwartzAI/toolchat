import React from 'react';
import { Plus, Trash, GripVertical, ChevronDown } from 'lucide-react';
import { useFieldArray, Control, UseFormRegister, FieldErrors } from 'react-hook-form';
import { DragDropContext, Droppable, Draggable } from '~/mocks/hello-pangea-dnd';
import { cn } from '~/utils';
import { Button, Input, Textarea, Label } from '~/components/ui';
import { useLocalize } from '~/hooks';
import LessonEditor from './LessonEditor';

interface ModuleEditorProps {
  moduleIndex: number;
  control: Control<any>;
  register: UseFormRegister<any>;
  errors: FieldErrors<any>;
  onRemove: () => void;
  dragHandleProps?: any;
}

export default function ModuleEditor({
  moduleIndex,
  control,
  register,
  errors,
  onRemove,
  dragHandleProps
}: ModuleEditorProps) {
  const localize = useLocalize();
  const [isExpanded, setIsExpanded] = React.useState(true);

  const { fields: lessons, append: appendLesson, remove: removeLesson, move: moveLesson } = useFieldArray({
    control,
    name: `modules.${moduleIndex}.lessons`
  });

  const handleAddLesson = () => {
    appendLesson({
      title: '',
      description: '',
      type: 'video',
      content: '',
      videoUrl: '',
      duration: 0,
      order: lessons.length,
      isLocked: false
    });
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;
    moveLesson(result.source.index, result.destination.index);
  };

  return (
    <div className="border border-border-light rounded-lg">
      {/* Module Header */}
      <div className="p-4 border-b border-border-light">
        <div className="flex items-start gap-3">
          <div {...dragHandleProps} className="mt-1 cursor-move">
            <GripVertical className="h-5 w-5 text-text-secondary" />
          </div>

          <div className="flex-1 space-y-4">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1 hover:bg-surface-hover rounded"
              >
                <ChevronDown
                  className={cn(
                    'h-4 w-4 transition-transform',
                    !isExpanded && '-rotate-90'
                  )}
                />
              </button>
              
              <Input
                {...register(`modules.${moduleIndex}.title`, {
                  required: localize('com_academy_module_title_required')
                })}
                placeholder={localize('com_academy_module_title_placeholder')}
                className="flex-1"
              />

              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={onRemove}
                className="text-red-600 hover:text-red-700"
              >
                <Trash className="h-4 w-4" />
              </Button>
            </div>

            {errors.modules?.[moduleIndex]?.title && (
              <p className="text-red-500 text-sm">
                {errors.modules[moduleIndex].title.message}
              </p>
            )}

            {isExpanded && (
              <div>
                <Label>{localize('com_academy_module_description')}</Label>
                <Textarea
                  {...register(`modules.${moduleIndex}.description`)}
                  placeholder={localize('com_academy_module_description_placeholder')}
                  className="mt-1"
                  rows={2}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lessons */}
      {isExpanded && (
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-text-primary">
              {localize('com_academy_lessons')}
            </h4>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddLesson}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              {localize('com_academy_add_lesson')}
            </Button>
          </div>

          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId={`lessons-${moduleIndex}`}>
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                  {lessons.map((lesson, lessonIndex) => (
                    <Draggable
                      key={lesson.id}
                      draggableId={`${moduleIndex}-${lesson.id}`}
                      index={lessonIndex}
                    >
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={cn(
                            snapshot.isDragging && 'shadow-lg'
                          )}
                        >
                          <LessonEditor
                            moduleIndex={moduleIndex}
                            lessonIndex={lessonIndex}
                            control={control}
                            register={register}
                            errors={errors}
                            onRemove={() => removeLesson(lessonIndex)}
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

          {lessons.length === 0 && (
            <div className="text-center py-8 bg-surface-primary rounded-lg border-2 border-dashed border-border-light">
              <p className="text-text-secondary mb-2">
                {localize('com_academy_no_lessons')}
              </p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleAddLesson}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                {localize('com_academy_add_first_lesson')}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}