import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { cn } from '~/utils';
import { useGetCourseQuery, useGetCourseProgressQuery } from '~/data-provider/Academy';
import { useLocalize, useAuthContext } from '~/hooks';
import { useToastContext } from '~/Providers';
import CourseHeader from './CourseHeader';
import ModuleAccordion from './ModuleAccordion';
import LessonViewer from './LessonViewer';
import CourseProgress from './CourseProgress';
import { Spinner } from '~/components/svg';

interface CourseViewerProps {
  className?: string;
}

export const CourseViewer: React.FC<CourseViewerProps> = ({ className }) => {
  const { courseId, lessonId } = useParams<{ courseId: string; lessonId?: string }>();
  const navigate = useNavigate();
  const localize = useLocalize();
  const { user } = useAuthContext();
  const { showToast } = useToastContext();
  
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(lessonId || null);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());

  const { data: course, isLoading: courseLoading, error: courseError } = useGetCourseQuery(courseId || '');
  const { data: progress, isLoading: progressLoading } = useGetCourseProgressQuery(courseId || '');

  useEffect(() => {
    if (lessonId && lessonId !== selectedLessonId) {
      setSelectedLessonId(lessonId);
    }
  }, [lessonId]);

  useEffect(() => {
    if (course && selectedLessonId) {
      // Find which module contains the selected lesson and expand it
      const moduleWithLesson = course.modules.find(module => 
        module.lessons.some(lesson => lesson._id === selectedLessonId)
      );
      if (moduleWithLesson) {
        setExpandedModules(prev => new Set(prev).add(moduleWithLesson._id));
      }
    }
  }, [course, selectedLessonId]);

  const handleLessonSelect = (lessonId: string) => {
    setSelectedLessonId(lessonId);
    navigate(`/academy/courses/${courseId}/lessons/${lessonId}`);
  };

  const handleModuleToggle = (moduleId: string) => {
    setExpandedModules(prev => {
      const newSet = new Set(prev);
      if (newSet.has(moduleId)) {
        newSet.delete(moduleId);
      } else {
        newSet.add(moduleId);
      }
      return newSet;
    });
  };

  const handleLessonComplete = () => {
    // Find next lesson
    if (!course) return;

    let foundCurrent = false;
    let nextLesson = null;

    for (const module of course.modules) {
      for (const lesson of module.lessons) {
        if (foundCurrent && !lesson.isLocked) {
          nextLesson = lesson;
          break;
        }
        if (lesson._id === selectedLessonId) {
          foundCurrent = true;
        }
      }
      if (nextLesson) break;
    }

    if (nextLesson) {
      handleLessonSelect(nextLesson._id);
      showToast({
        message: localize('com_academy_next_lesson_started'),
        status: 'success'
      });
    } else {
      showToast({
        message: localize('com_academy_course_completed'),
        status: 'success'
      });
    }
  };

  if (courseLoading || progressLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (courseError) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <p className="text-red-500 mb-4">{localize('com_academy_course_load_error')}</p>
        <button
          onClick={() => navigate('/academy')}
          className="text-blue-500 hover:underline"
        >
          {localize('com_academy_back_to_courses')}
        </button>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex items-center justify-center h-full">
        <p>{localize('com_academy_course_not_found')}</p>
      </div>
    );
  }

  const selectedLesson = course.modules
    .flatMap(module => module.lessons)
    .find(lesson => lesson._id === selectedLessonId);

  return (
    <div className={cn('flex h-full', className)}>
      {/* Sidebar */}
      <div className="w-80 border-r border-border-light bg-surface-secondary overflow-y-auto">
        <div className="p-4">
          <CourseHeader course={course} progress={progress} />
          <CourseProgress progress={progress} className="mt-4 mb-6" />
          
          <div className="space-y-2">
            {course.modules.map((module, moduleIndex) => (
              <ModuleAccordion
                key={module._id}
                module={module}
                moduleIndex={moduleIndex}
                isExpanded={expandedModules.has(module._id)}
                onToggle={() => handleModuleToggle(module._id)}
                lessons={module.lessons}
                selectedLessonId={selectedLessonId}
                onLessonSelect={handleLessonSelect}
                progress={progress}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        {selectedLesson ? (
          <LessonViewer
            lesson={selectedLesson}
            course={course}
            onComplete={handleLessonComplete}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-text-secondary">{localize('com_academy_select_lesson')}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseViewer;