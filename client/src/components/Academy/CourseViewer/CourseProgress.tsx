import React from 'react';
import { cn } from '~/utils';
import { useLocalize } from '~/hooks';
import type { CourseProgress } from '~/data-provider/Academy/types';

interface CourseProgressProps {
  progress?: CourseProgress;
  className?: string;
}

export const CourseProgress: React.FC<CourseProgressProps> = ({ progress, className }) => {
  const localize = useLocalize();
  
  const percentComplete = progress?.percentComplete || 0;
  
  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between text-sm">
        <span className="text-text-secondary">{localize('com_academy_progress')}</span>
        <span className="font-medium text-text-primary">{Math.round(percentComplete)}%</span>
      </div>
      
      <div className="relative h-2 bg-surface-tertiary rounded-full overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${percentComplete}%` }}
        />
        {/* Animated shimmer effect */}
        <div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"
          style={{ width: `${percentComplete}%` }}
        />
      </div>
      
      {progress?.lastAccessedAt && (
        <p className="text-xs text-text-secondary">
          {localize('com_academy_last_accessed')}: {new Date(progress.lastAccessedAt).toLocaleDateString()}
        </p>
      )}
    </div>
  );
};

export default CourseProgress;