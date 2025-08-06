import React, { useState, useEffect } from 'react';
import { ChevronRight, Download, ExternalLink, CheckCircle } from 'lucide-react';
import { cn } from '~/utils';
import { Button } from '~/components/ui';
import { VideoPlayer, useVideoProgress, detectVideoProvider } from '../VideoPlayer';
import LessonContent from './LessonContent';
import { useLocalize } from '~/hooks';
import { useMarkLessonCompleteMutation } from '~/data-provider/Academy';
import { useToastContext } from '~/Providers';
import type { Lesson, Course } from '~/data-provider/Academy/types';

interface LessonViewerProps {
  lesson: Lesson;
  course: Course;
  onComplete?: () => void;
  className?: string;
}

export const LessonViewer: React.FC<LessonViewerProps> = ({
  lesson,
  course,
  onComplete,
  className
}) => {
  const localize = useLocalize();
  const { showToast } = useToastContext();
  const [manuallyCompleted, setManuallyCompleted] = useState(false);
  
  const markComplete = useMarkLessonCompleteMutation();
  
  const {
    percentComplete,
    handleProgress,
    handleComplete: handleVideoComplete,
    resetProgress
  } = useVideoProgress({
    lessonId: lesson._id,
    onComplete: () => {
      handleLessonComplete();
    }
  });

  useEffect(() => {
    // Reset progress when lesson changes
    resetProgress();
    setManuallyCompleted(false);
  }, [lesson._id, resetProgress]);

  const handleLessonComplete = () => {
    markComplete.mutate(
      { lessonId: lesson._id },
      {
        onSuccess: () => {
          if (onComplete) {
            onComplete();
          }
        },
        onError: (error) => {
          showToast({
            message: localize('com_academy_complete_error'),
            status: 'error'
          });
        }
      }
    );
  };

  const handleMarkComplete = () => {
    setManuallyCompleted(true);
    handleLessonComplete();
  };

  const videoProvider = lesson.type === 'video' && lesson.videoUrl 
    ? detectVideoProvider(lesson.videoUrl) 
    : null;

  return (
    <div className={cn('h-full flex flex-col', className)}>
      {/* Lesson Header */}
      <div className="border-b border-border-light px-6 py-4">
        <div className="flex items-center gap-2 text-sm text-text-secondary mb-2">
          <span>{course.title}</span>
          <ChevronRight className="h-4 w-4" />
          <span>{lesson.title}</span>
        </div>
        <h1 className="text-2xl font-bold text-text-primary">{lesson.title}</h1>
        {lesson.description && (
          <p className="mt-2 text-text-secondary">{lesson.description}</p>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-6">
          {/* Video Player */}
          {lesson.type === 'video' && lesson.videoUrl && videoProvider && (
            <div className="mb-8">
              <VideoPlayer
                lessonId={lesson._id}
                videoUrl={lesson.videoUrl}
                provider={videoProvider}
                onProgress={handleProgress}
                onComplete={handleVideoComplete}
              />
              {percentComplete > 0 && percentComplete < 100 && (
                <div className="mt-2">
                  <div className="h-1 bg-surface-tertiary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 transition-all duration-300"
                      style={{ width: `${percentComplete}%` }}
                    />
                  </div>
                  <p className="text-xs text-text-secondary mt-1">
                    {Math.round(percentComplete)}% {localize('com_academy_watched')}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Text Content */}
          {lesson.content && (
            <div className="prose prose-lg dark:prose-invert max-w-none">
              <LessonContent content={lesson.content} />
            </div>
          )}

          {/* Resources */}
          {lesson.resources && lesson.resources.length > 0 && (
            <div className="mt-8 p-4 bg-surface-secondary rounded-lg">
              <h3 className="font-medium text-text-primary mb-3">
                {localize('com_academy_resources')}
              </h3>
              <div className="space-y-2">
                {lesson.resources.map((resource, index) => (
                  <a
                    key={index}
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-blue-600 hover:underline"
                  >
                    {resource.type === 'download' ? (
                      <Download className="h-4 w-4" />
                    ) : (
                      <ExternalLink className="h-4 w-4" />
                    )}
                    <span>{resource.title}</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Completion Button */}
          {lesson.type === 'text' && !manuallyCompleted && (
            <div className="mt-8 flex justify-center">
              <Button
                onClick={handleMarkComplete}
                variant="submit"
                className="gap-2"
                disabled={markComplete.isLoading}
              >
                <CheckCircle className="h-5 w-5" />
                {localize('com_academy_mark_complete')}
              </Button>
            </div>
          )}

          {/* Completion Message */}
          {(manuallyCompleted || percentComplete === 100) && (
            <div className="mt-8 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">{localize('com_academy_lesson_completed')}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LessonViewer;