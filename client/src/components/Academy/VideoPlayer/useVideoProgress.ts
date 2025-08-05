import { useCallback, useRef, useState, useEffect } from 'react';
import { useUpdateLessonProgressMutation } from '~/data-provider/Academy';
import { useToastContext } from '~/Providers';
import { useLocalize } from '~/hooks';
import { debounce } from 'lodash';

interface UseVideoProgressOptions {
  lessonId: string;
  onProgressUpdate?: (progress: number) => void;
  onComplete?: () => void;
  debounceDelay?: number;
}

export const useVideoProgress = ({
  lessonId,
  onProgressUpdate,
  onComplete,
  debounceDelay = 5000 // 5 seconds default
}: UseVideoProgressOptions) => {
  const localize = useLocalize();
  const { showToast } = useToastContext();
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const lastSavedProgressRef = useRef(0);
  const hasCompletedRef = useRef(false);
  
  const { mutate: updateProgress } = useUpdateLessonProgressMutation({
    onError: (error) => {
      console.error('Failed to update progress:', error);
      showToast({
        message: localize('com_academy_progress_save_error'),
        status: 'error'
      });
    }
  });

  // Debounced save function
  const debouncedSave = useRef(
    debounce((currentTime: number, videoDuration: number) => {
      // Only save if progress has changed significantly (at least 2 seconds)
      if (Math.abs(currentTime - lastSavedProgressRef.current) < 2) {
        return;
      }

      updateProgress({
        lessonId,
        progress: {
          lastPosition: currentTime,
          percentComplete: videoDuration > 0 ? (currentTime / videoDuration) * 100 : 0,
          completed: false
        }
      });

      lastSavedProgressRef.current = currentTime;
    }, debounceDelay)
  ).current;

  const handleProgress = useCallback((currentTime: number, videoDuration: number) => {
    setProgress(currentTime);
    setDuration(videoDuration);

    const percentComplete = videoDuration > 0 ? (currentTime / videoDuration) * 100 : 0;
    
    if (onProgressUpdate) {
      onProgressUpdate(percentComplete);
    }

    // Save progress with debounce
    debouncedSave(currentTime, videoDuration);
  }, [debouncedSave, onProgressUpdate]);

  const handleComplete = useCallback(() => {
    if (hasCompletedRef.current) {
      return;
    }

    hasCompletedRef.current = true;

    // Save completion immediately (not debounced)
    updateProgress({
      lessonId,
      progress: {
        lastPosition: duration,
        percentComplete: 100,
        completed: true
      }
    });

    if (onComplete) {
      onComplete();
    }

    showToast({
      message: localize('com_academy_lesson_completed'),
      status: 'success'
    });
  }, [duration, lessonId, updateProgress, onComplete, showToast, localize]);

  // Save progress when component unmounts or lesson changes
  useEffect(() => {
    return () => {
      // Cancel pending debounced saves
      debouncedSave.cancel();

      // Save current progress immediately if there's unsaved progress
      if (progress > 0 && progress !== lastSavedProgressRef.current) {
        updateProgress({
          lessonId,
          progress: {
            lastPosition: progress,
            percentComplete: duration > 0 ? (progress / duration) * 100 : 0,
            completed: false
          }
        });
      }
    };
  }, [lessonId, progress, duration]);

  const resetProgress = useCallback(() => {
    setProgress(0);
    setDuration(0);
    lastSavedProgressRef.current = 0;
    hasCompletedRef.current = false;
  }, []);

  return {
    progress,
    duration,
    percentComplete: duration > 0 ? (progress / duration) * 100 : 0,
    handleProgress,
    handleComplete,
    resetProgress
  };
};