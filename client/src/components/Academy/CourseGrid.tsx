import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Users, Award, Lock } from 'lucide-react';
import { cn } from '~/utils';
import { Button } from '~/components/ui';
import { Skeleton } from '~/components/ui';
import { useLocalize } from '~/hooks';
import { useGetUserEnrollmentsQuery } from '~/data-provider/Academy';
import { useAuthContext } from '~/hooks';
import type { Course } from '~/data-provider/Academy/types';

interface CourseGridProps {
  courses: Course[];
  isLoading?: boolean;
  showProgress?: boolean;
  className?: string;
}

interface CourseCardProps {
  course: Course;
  isEnrolled?: boolean;
  progress?: number;
  showProgress?: boolean;
}

const CourseCard: React.FC<CourseCardProps> = ({ course, isEnrolled, progress, showProgress }) => {
  const navigate = useNavigate();
  const localize = useLocalize();

  const handleClick = () => {
    navigate(`/academy/courses/${course._id}`);
  };

  const totalDuration = course.modules.reduce((acc, module) => 
    acc + module.lessons.reduce((lessonAcc, lesson) => lessonAcc + (lesson.duration || 0), 0), 0
  );

  const totalLessons = course.modules.reduce((acc, module) => acc + module.lessons.length, 0);

  return (
    <div
      onClick={handleClick}
      className="bg-surface-secondary rounded-lg overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer group"
    >
      {/* Thumbnail */}
      <div className="aspect-video bg-surface-tertiary relative overflow-hidden">
        {course.thumbnail ? (
          <img
            src={course.thumbnail}
            alt={course.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Award className="h-12 w-12 text-text-secondary" />
          </div>
        )}
        
        {/* Progress overlay */}
        {showProgress && progress !== undefined && (
          <div className="absolute inset-x-0 bottom-0 h-1 bg-surface-primary/50">
            <div
              className="h-full bg-green-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        {/* Badge */}
        {!course.isPublished && (
          <div className="absolute top-2 right-2 px-2 py-1 bg-yellow-500 text-white text-xs rounded">
            {localize('com_academy_draft')}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-text-primary mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
          {course.title}
        </h3>
        
        <p className="text-sm text-text-secondary mb-3 line-clamp-2">
          {course.description}
        </p>

        {/* Meta info */}
        <div className="flex items-center gap-4 text-xs text-text-secondary mb-3">
          <div className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            <span>{Math.floor(totalDuration / 60)}m</span>
          </div>
          <div className="flex items-center gap-1">
            <Award className="h-3.5 w-3.5" />
            <span>{totalLessons} {localize('com_academy_lessons')}</span>
          </div>
          {course.enrolledCount !== undefined && (
            <div className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              <span>{course.enrolledCount}</span>
            </div>
          )}
        </div>

        {/* Author */}
        {course.author && (
          <div className="flex items-center gap-2 mb-3">
            {course.author.avatar ? (
              <img
                src={course.author.avatar}
                alt={course.author.name}
                className="h-6 w-6 rounded-full"
              />
            ) : (
              <div className="h-6 w-6 rounded-full bg-surface-tertiary flex items-center justify-center">
                <span className="text-xs">{course.author.name[0]}</span>
              </div>
            )}
            <span className="text-sm text-text-secondary">{course.author.name}</span>
          </div>
        )}

        {/* Action button */}
        <Button
          variant={isEnrolled ? 'outline' : 'submit'}
          size="sm"
          className="w-full"
          onClick={(e) => {
            e.stopPropagation();
            handleClick();
          }}
        >
          {isEnrolled ? localize('com_academy_continue_learning') : localize('com_academy_view_course')}
        </Button>
      </div>
    </div>
  );
};

export const CourseGrid: React.FC<CourseGridProps> = ({
  courses,
  isLoading = false,
  showProgress = false,
  className
}) => {
  const localize = useLocalize();
  const { user } = useAuthContext();
  const { data: enrollments } = useGetUserEnrollmentsQuery(user?._id || '');

  if (isLoading) {
    return (
      <div className={cn('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6', className)}>
        {[...Array(6)].map((_, index) => (
          <div key={index} className="bg-surface-secondary rounded-lg overflow-hidden">
            <Skeleton className="aspect-video" />
            <div className="p-4 space-y-2">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-8 w-full mt-3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-text-secondary">{localize('com_academy_no_courses_found')}</p>
      </div>
    );
  }

  return (
    <div className={cn('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6', className)}>
      {courses.map((course) => {
        const enrollment = enrollments?.find(e => e.courseId === course._id);
        const isEnrolled = !!enrollment;
        const progress = enrollment?.progress?.percentComplete;

        return (
          <CourseCard
            key={course._id}
            course={course}
            isEnrolled={isEnrolled}
            progress={progress}
            showProgress={showProgress && isEnrolled}
          />
        );
      })}
    </div>
  );
};

export default CourseGrid;