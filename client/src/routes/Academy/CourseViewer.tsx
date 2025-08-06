import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BookOpen, Clock, Users, PlayCircle, FileText, ChevronRight } from 'lucide-react';
import { useRecoilState, useSetRecoilState } from 'recoil';
import { useGetCourseQuery, useGetCourseProgressQuery } from '~/data-provider';
import { useLocalize } from '~/hooks';
import store from '~/store';
import { cn } from '~/utils';

export default function CourseViewer() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const localize = useLocalize();
  
  const setCurrentCourse = useSetRecoilState(store.currentCourse);
  const setCurrentLesson = useSetRecoilState(store.currentLesson);
  
  const { data: course, isLoading: courseLoading } = useGetCourseQuery(courseId || '');
  const { data: progress, isLoading: progressLoading } = useGetCourseProgressQuery(courseId || '');

  useEffect(() => {
    if (course) {
      setCurrentCourse(course);
    }
  }, [course, setCurrentCourse]);

  const handleLessonClick = (lesson: any) => {
    setCurrentLesson(lesson);
    navigate(`/academy/courses/${courseId}/lessons/${lesson._id}`);
  };

  const handleEnroll = () => {
    // TODO: Implement enrollment
    console.log('Enrolling in course:', courseId);
  };

  if (courseLoading || progressLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <BookOpen className="w-16 h-16 text-text-tertiary mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Course Not Found</h2>
          <p className="text-text-secondary mb-4">The course you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/academy')}
            className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
          >
            Back to Academy
          </button>
        </div>
      </div>
    );
  }

  const isEnrolled = !!progress;
  const completedLessons = progress?.completedLessons || 0;
  const totalLessons = course.modules?.reduce((total, module) => total + (module.lessons?.length || 0), 0) || 0;
  const progressPercentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  return (
    <div className="h-full overflow-y-auto">
      {/* Course Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-4">{course.title}</h1>
          <p className="text-lg mb-6 opacity-90">{course.description}</p>
          
          <div className="flex flex-wrap items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>{course.duration || '4 weeks'}</span>
            </div>
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              <span>{totalLessons} lessons</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span>{course.enrolledCount || 0} students</span>
            </div>
          </div>

          {!isEnrolled ? (
            <button
              onClick={handleEnroll}
              className="mt-6 bg-white text-green-600 px-6 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors"
            >
              Enroll in Course
            </button>
          ) : (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm">Your Progress</span>
                <span className="text-sm font-medium">{progressPercentage}%</span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-2">
                <div 
                  className="bg-white rounded-full h-2 transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Course Content */}
      <div className="max-w-4xl mx-auto p-8">
        <h2 className="text-2xl font-semibold mb-6">Course Content</h2>
        
        {course.modules?.map((module, moduleIndex) => (
          <div key={module._id} className="mb-6">
            <div className="bg-surface-secondary rounded-lg overflow-hidden">
              <div className="p-4 border-b border-border-light">
                <h3 className="font-medium text-lg">
                  Module {moduleIndex + 1}: {module.title}
                </h3>
                {module.description && (
                  <p className="text-sm text-text-secondary mt-1">{module.description}</p>
                )}
              </div>
              
              <div className="divide-y divide-border-light">
                {module.lessons?.map((lesson, lessonIndex) => {
                  const isCompleted = progress?.lessonProgress?.[lesson._id]?.completed;
                  
                  return (
                    <button
                      key={lesson._id}
                      onClick={() => handleLessonClick(lesson)}
                      className={cn(
                        "w-full p-4 flex items-center gap-4 hover:bg-surface-hover transition-colors text-left",
                        isCompleted && "bg-green-50 dark:bg-green-900/10"
                      )}
                    >
                      <div className={cn(
                        "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
                        isCompleted ? "bg-green-500 text-white" : "bg-surface-tertiary text-text-tertiary"
                      )}>
                        {lesson.type === 'video' ? (
                          <PlayCircle className="w-4 h-4" />
                        ) : (
                          <FileText className="w-4 h-4" />
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <h4 className="font-medium">
                          Lesson {lessonIndex + 1}: {lesson.title}
                        </h4>
                        {lesson.duration && (
                          <p className="text-sm text-text-secondary">{lesson.duration}</p>
                        )}
                      </div>
                      
                      <ChevronRight className="w-5 h-5 text-text-tertiary" />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ))}

        {/* Course Resources */}
        {course.resources && course.resources.length > 0 && (
          <div className="mt-8">
            <h2 className="text-2xl font-semibold mb-4">Resources</h2>
            <div className="bg-surface-secondary rounded-lg p-4">
              {course.resources.map((resource, index) => (
                <a
                  key={index}
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 hover:bg-surface-hover rounded-lg transition-colors"
                >
                  <FileText className="w-5 h-5 text-text-tertiary" />
                  <span className="text-sm">{resource.title}</span>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}