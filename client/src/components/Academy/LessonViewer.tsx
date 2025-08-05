import React from 'react';
import { PlayCircle, FileText, CheckCircle } from 'lucide-react';
import { cn } from '~/utils';

interface LessonViewerProps {
  lesson: {
    _id: string;
    title: string;
    description?: string;
    type: 'video' | 'text' | 'quiz';
    videoUrl?: string;
    content?: string;
    duration?: number;
  };
  isCompleted?: boolean;
  onComplete?: () => void;
}

const LessonViewer: React.FC<LessonViewerProps> = ({ lesson, isCompleted, onComplete }) => {
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-surface-secondary rounded-lg p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-medium text-text-primary flex items-center gap-2">
            {lesson.type === 'video' ? (
              <PlayCircle className="w-5 h-5 text-green-500" />
            ) : (
              <FileText className="w-5 h-5 text-blue-500" />
            )}
            {lesson.title}
          </h3>
          {lesson.description && (
            <p className="text-sm text-text-secondary mt-1">{lesson.description}</p>
          )}
        </div>
        {isCompleted && (
          <CheckCircle className="w-5 h-5 text-green-500" />
        )}
      </div>

      {lesson.type === 'video' && lesson.videoUrl && (
        <div className="mb-3">
          <div className="relative bg-black rounded-lg overflow-hidden" style={{ paddingBottom: '56.25%' }}>
            <iframe
              src={lesson.videoUrl.replace('watch?v=', 'embed/')}
              className="absolute inset-0 w-full h-full"
              allowFullScreen
              title={lesson.title}
            />
          </div>
          {lesson.duration && (
            <div className="mt-2 text-sm text-text-tertiary">
              Duration: {formatDuration(lesson.duration)}
            </div>
          )}
        </div>
      )}

      {lesson.type === 'text' && lesson.content && (
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <div dangerouslySetInnerHTML={{ __html: lesson.content }} />
        </div>
      )}

      {!isCompleted && onComplete && (
        <button
          onClick={onComplete}
          className="mt-4 w-full bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 transition-colors"
        >
          Mark as Complete
        </button>
      )}
    </div>
  );
};

export default LessonViewer;