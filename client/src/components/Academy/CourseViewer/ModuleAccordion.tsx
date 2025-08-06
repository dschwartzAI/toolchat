import React from 'react';
import { ChevronDown, Lock, CheckCircle, PlayCircle } from 'lucide-react';
import { cn } from '~/utils';
import { useLocalize } from '~/hooks';
import type { Module, Lesson, CourseProgress } from '~/data-provider/Academy/types';

interface ModuleAccordionProps {
  module: Module;
  moduleIndex: number;
  isExpanded: boolean;
  onToggle: () => void;
  lessons: Lesson[];
  selectedLessonId: string | null;
  onLessonSelect: (lessonId: string) => void;
  progress?: CourseProgress;
  className?: string;
}

export const ModuleAccordion: React.FC<ModuleAccordionProps> = ({
  module,
  moduleIndex,
  isExpanded,
  onToggle,
  lessons,
  selectedLessonId,
  onLessonSelect,
  progress,
  className
}) => {
  const localize = useLocalize();

  const completedLessonsInModule = lessons.filter(lesson => 
    progress?.completedLessons?.includes(lesson._id)
  ).length;

  const moduleProgress = lessons.length > 0 ? (completedLessonsInModule / lessons.length) * 100 : 0;

  return (
    <div className={cn('border border-border-light rounded-lg overflow-hidden', className)}>
      {/* Module Header */}
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center justify-between bg-surface-primary hover:bg-surface-hover transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-surface-secondary text-sm font-medium">
            {moduleIndex + 1}
          </div>
          <div className="text-left">
            <h3 className="font-medium text-text-primary">{module.title}</h3>
            <p className="text-xs text-text-secondary">
              {completedLessonsInModule}/{lessons.length} {localize('com_academy_lessons_completed')}
            </p>
          </div>
        </div>
        <ChevronDown
          className={cn(
            'h-5 w-5 text-text-secondary transition-transform',
            isExpanded && 'rotate-180'
          )}
        />
      </button>

      {/* Progress Bar */}
      <div className="h-1 bg-surface-secondary">
        <div
          className="h-full bg-green-500 transition-all duration-300"
          style={{ width: `${moduleProgress}%` }}
        />
      </div>

      {/* Lessons List */}
      {isExpanded && (
        <div className="bg-surface-secondary">
          {lessons.map((lesson, lessonIndex) => {
            const isCompleted = progress?.completedLessons?.includes(lesson._id);
            const isLocked = lesson.isLocked && !isCompleted;
            const isSelected = lesson._id === selectedLessonId;

            return (
              <button
                key={lesson._id}
                onClick={() => !isLocked && onLessonSelect(lesson._id)}
                disabled={isLocked}
                className={cn(
                  'w-full px-4 py-3 flex items-center gap-3 text-left transition-colors',
                  'hover:bg-surface-hover',
                  isSelected && 'bg-surface-tertiary',
                  isLocked && 'opacity-50 cursor-not-allowed'
                )}
              >
                <div className="flex-shrink-0">
                  {isCompleted ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : isLocked ? (
                    <Lock className="h-5 w-5 text-text-secondary" />
                  ) : (
                    <PlayCircle className="h-5 w-5 text-text-secondary" />
                  )}
                </div>
                <div className="flex-1">
                  <h4 className={cn(
                    'font-medium',
                    isSelected ? 'text-blue-600' : 'text-text-primary'
                  )}>
                    {lesson.title}
                  </h4>
                  {lesson.duration && (
                    <p className="text-xs text-text-secondary">
                      {Math.floor(lesson.duration / 60)} {localize('com_academy_minutes')}
                    </p>
                  )}
                </div>
                {lesson.type === 'video' && (
                  <span className="text-xs bg-surface-tertiary px-2 py-1 rounded">
                    {localize('com_academy_video')}
                  </span>
                )}
                {lesson.type === 'text' && (
                  <span className="text-xs bg-surface-tertiary px-2 py-1 rounded">
                    {localize('com_academy_article')}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ModuleAccordion;