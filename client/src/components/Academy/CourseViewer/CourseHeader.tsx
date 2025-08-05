import React from 'react';
import { ArrowLeft, Users, Clock, Award } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '~/utils';
import { Button } from '~/components/ui';
import { useLocalize } from '~/hooks';
import type { Course, CourseProgress } from '~/data-provider/Academy/types';

interface CourseHeaderProps {
  course: Course;
  progress?: CourseProgress;
  className?: string;
}

export const CourseHeader: React.FC<CourseHeaderProps> = ({ course, progress, className }) => {
  const navigate = useNavigate();
  const localize = useLocalize();

  const totalLessons = course.modules.reduce((acc, module) => acc + module.lessons.length, 0);
  const completedLessons = progress?.lessonsCompleted || 0;
  const estimatedDuration = course.modules.reduce((acc, module) => 
    acc + module.lessons.reduce((lessonAcc, lesson) => lessonAcc + (lesson.duration || 0), 0), 0
  );

  return (
    <div className={cn('space-y-4', className)}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate('/academy')}
        className="mb-2"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        {localize('com_academy_back_to_courses')}
      </Button>

      <div>
        <h1 className="text-2xl font-bold text-text-primary mb-2">{course.title}</h1>
        <p className="text-text-secondary text-sm">{course.description}</p>
      </div>

      <div className="flex items-center gap-4 text-sm text-text-secondary">
        <div className="flex items-center gap-1">
          <Award className="h-4 w-4" />
          <span>{completedLessons}/{totalLessons} {localize('com_academy_lessons')}</span>
        </div>
        <div className="flex items-center gap-1">
          <Clock className="h-4 w-4" />
          <span>{Math.floor(estimatedDuration / 60)} {localize('com_academy_minutes')}</span>
        </div>
        {course.enrolledCount && (
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>{course.enrolledCount} {localize('com_academy_enrolled')}</span>
          </div>
        )}
      </div>

      {course.author && (
        <div className="flex items-center gap-2 pt-2 border-t border-border-light">
          {course.author.avatar && (
            <img
              src={course.author.avatar}
              alt={course.author.name}
              className="h-8 w-8 rounded-full"
            />
          )}
          <div>
            <p className="text-sm font-medium">{course.author.name}</p>
            <p className="text-xs text-text-secondary">{localize('com_academy_instructor')}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseHeader;