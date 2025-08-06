import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react';
import { useRecoilValue } from 'recoil';
import { useGetLessonQuery, useUpdateLessonProgressMutation, useMarkLessonCompleteMutation } from '~/data-provider';
import VideoPlayer from '~/components/Academy/VideoPlayer/VideoPlayer';
import { useLocalize } from '~/hooks';
import store from '~/store';
import { cn } from '~/utils';

export default function LessonViewer() {
  const { courseId, lessonId } = useParams<{ courseId: string; lessonId: string }>();
  const navigate = useNavigate();
  const localize = useLocalize();
  
  const currentCourse = useRecoilValue(store.currentCourse);
  const [watchTime, setWatchTime] = useState(0);
  const [hasCompletedVideo, setHasCompletedVideo] = useState(false);
  
  const { data: lesson, isLoading } = useGetLessonQuery(lessonId || '');
  const updateProgressMutation = useUpdateLessonProgressMutation();
  const markCompleteMutation = useMarkLessonCompleteMutation();

  // Find current module and lesson index
  const currentModuleAndLesson = React.useMemo(() => {
    if (!currentCourse?.modules || !lessonId) return null;
    
    for (const module of currentCourse.modules) {
      const lessonIndex = module.lessons?.findIndex(l => l._id === lessonId);
      if (lessonIndex !== undefined && lessonIndex >= 0) {
        return { module, lessonIndex, lessons: module.lessons };
      }
    }
    return null;
  }, [currentCourse, lessonId]);

  const nextLesson = React.useMemo(() => {
    if (!currentModuleAndLesson) return null;
    const { lessons, lessonIndex } = currentModuleAndLesson;
    return lessons?.[lessonIndex + 1] || null;
  }, [currentModuleAndLesson]);

  const prevLesson = React.useMemo(() => {
    if (!currentModuleAndLesson) return null;
    const { lessons, lessonIndex } = currentModuleAndLesson;
    return lessons?.[lessonIndex - 1] || null;
  }, [currentModuleAndLesson]);

  const handleVideoProgress = (progress: number) => {
    setWatchTime(progress);
    // Update progress every 10 seconds
    if (Math.floor(progress) % 10 === 0) {
      updateProgressMutation.mutate({
        lessonId: lessonId!,
        progress: { watchTime: progress }
      });
    }
  };

  const handleVideoComplete = () => {
    setHasCompletedVideo(true);
  };

  const handleMarkComplete = () => {
    markCompleteMutation.mutate(
      { lessonId: lessonId! },
      {
        onSuccess: () => {
          if (nextLesson) {
            navigate(`/academy/courses/${courseId}/lessons/${nextLesson._id}`);
          }
        }
      }
    );
  };

  const handleNavigation = (lesson: any) => {
    navigate(`/academy/courses/${courseId}/lessons/${lesson._id}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Lesson Not Found</h2>
          <button
            onClick={() => navigate(`/academy/courses/${courseId}`)}
            className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
          >
            Back to Course
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b border-border-light p-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate(`/academy/courses/${courseId}`)}
            className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Course</span>
          </button>
          
          <div className="flex items-center gap-4">
            {prevLesson && (
              <button
                onClick={() => handleNavigation(prevLesson)}
                className="p-2 hover:bg-surface-hover rounded-lg transition-colors"
                aria-label="Previous lesson"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            {nextLesson && (
              <button
                onClick={() => handleNavigation(nextLesson)}
                className="p-2 hover:bg-surface-hover rounded-lg transition-colors"
                aria-label="Next lesson"
              >
                <ArrowRight className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-8">
          <h1 className="text-2xl font-bold mb-2">{lesson.title}</h1>
          {lesson.description && (
            <p className="text-text-secondary mb-6">{lesson.description}</p>
          )}

          {/* Video Lesson */}
          {lesson.type === 'video' && lesson.videoUrl && (
            <div className="mb-8">
              <VideoPlayer
                url={lesson.videoUrl}
                onProgress={handleVideoProgress}
                onComplete={handleVideoComplete}
                initialTime={lesson.progress?.lastPosition || 0}
              />
            </div>
          )}

          {/* Text Lesson */}
          {lesson.type === 'text' && lesson.content && (
            <div className="prose prose-lg dark:prose-invert max-w-none mb-8">
              <div dangerouslySetInnerHTML={{ __html: lesson.content }} />
            </div>
          )}

          {/* Quiz Lesson */}
          {lesson.type === 'quiz' && (
            <div className="bg-surface-secondary rounded-lg p-6 mb-8">
              <p className="text-center text-text-secondary">Quiz functionality coming soon!</p>
            </div>
          )}

          {/* Complete Lesson Button */}
          <div className="flex items-center justify-between p-6 bg-surface-secondary rounded-lg">
            <div>
              <h3 className="font-medium mb-1">
                {lesson.progress?.completed ? 'Lesson Completed!' : 'Mark as Complete'}
              </h3>
              <p className="text-sm text-text-secondary">
                {lesson.progress?.completed 
                  ? 'You can review this lesson anytime'
                  : 'Click to mark this lesson as complete and continue'}
              </p>
            </div>
            
            {!lesson.progress?.completed && (
              <button
                onClick={handleMarkComplete}
                disabled={lesson.type === 'video' && !hasCompletedVideo}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors",
                  lesson.type === 'video' && !hasCompletedVideo
                    ? "bg-surface-tertiary text-text-tertiary cursor-not-allowed"
                    : "bg-green-500 text-white hover:bg-green-600"
                )}
              >
                <CheckCircle className="w-5 h-5" />
                Complete Lesson
              </button>
            )}
            
            {lesson.progress?.completed && nextLesson && (
              <button
                onClick={() => handleNavigation(nextLesson)}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors"
              >
                Next Lesson
                <ArrowRight className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Resources */}
          {lesson.resources && lesson.resources.length > 0 && (
            <div className="mt-8">
              <h2 className="text-lg font-semibold mb-4">Lesson Resources</h2>
              <div className="space-y-2">
                {lesson.resources.map((resource, index) => (
                  <a
                    key={index}
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 bg-surface-secondary rounded-lg hover:bg-surface-hover transition-colors"
                  >
                    <span className="text-sm">{resource.title}</span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}