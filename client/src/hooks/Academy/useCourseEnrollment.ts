import { useCallback, useMemo } from 'react';
import { useAuthContext } from '~/hooks/AuthContext';
import { useToastContext } from '~/Providers';
import { useLocalize } from '~/hooks';
import {
  useEnrollInCourseMutation,
  useUnenrollFromCourseMutation,
  useGetUserEnrollmentsQuery,
  useGetCourseQuery
} from '~/data-provider/Academy';

export const useCourseEnrollment = (courseId?: string) => {
  const { user } = useAuthContext();
  const { showToast } = useToastContext();
  const localize = useLocalize();

  const { data: enrollments, isLoading: enrollmentsLoading } = useGetUserEnrollmentsQuery(
    user?._id || '',
    { enabled: !!user?._id }
  );

  const { data: course } = useGetCourseQuery(
    courseId || '',
    { enabled: !!courseId }
  );

  const enrollMutation = useEnrollInCourseMutation();
  const unenrollMutation = useUnenrollFromCourseMutation();

  const isEnrolled = useMemo(() => {
    if (!courseId || !enrollments) return false;
    return enrollments.some(enrollment => enrollment.courseId === courseId);
  }, [courseId, enrollments]);

  const canEnroll = useMemo(() => {
    if (!course || !user) return false;
    
    // Check if course is published
    if (!course.isPublished) return false;
    
    // Check if already enrolled
    if (isEnrolled) return false;
    
    // Check if course has enrollment limit
    if (course.maxEnrollments && course.enrolledCount >= course.maxEnrollments) {
      return false;
    }
    
    // Check if course has prerequisites
    if (course.prerequisites && course.prerequisites.length > 0) {
      const completedCourses = enrollments
        ?.filter(e => e.progress?.percentComplete === 100)
        .map(e => e.courseId) || [];
      
      return course.prerequisites.every(prereq => completedCourses.includes(prereq));
    }
    
    return true;
  }, [course, user, isEnrolled, enrollments]);

  const enroll = useCallback(async () => {
    if (!courseId || !canEnroll) return;

    enrollMutation.mutate(
      { courseId },
      {
        onSuccess: () => {
          showToast({
            message: localize('com_academy_enrolled_success'),
            status: 'success'
          });
        },
        onError: (error: any) => {
          showToast({
            message: error.message || localize('com_academy_enroll_error'),
            status: 'error'
          });
        }
      }
    );
  }, [courseId, canEnroll, enrollMutation, showToast, localize]);

  const unenroll = useCallback(async () => {
    if (!courseId || !isEnrolled) return;

    if (!window.confirm(localize('com_academy_confirm_unenroll'))) {
      return;
    }

    unenrollMutation.mutate(
      { courseId },
      {
        onSuccess: () => {
          showToast({
            message: localize('com_academy_unenrolled_success'),
            status: 'success'
          });
        },
        onError: (error: any) => {
          showToast({
            message: error.message || localize('com_academy_unenroll_error'),
            status: 'error'
          });
        }
      }
    );
  }, [courseId, isEnrolled, unenrollMutation, showToast, localize]);

  const enrollmentStatus = useMemo(() => {
    if (!courseId || !enrollments) return null;
    
    const enrollment = enrollments.find(e => e.courseId === courseId);
    if (!enrollment) return null;
    
    return {
      enrolledAt: enrollment.enrolledAt,
      progress: enrollment.progress,
      lastAccessedAt: enrollment.lastAccessedAt,
      completedAt: enrollment.completedAt,
      isCompleted: enrollment.progress?.percentComplete === 100
    };
  }, [courseId, enrollments]);

  return {
    isEnrolled,
    canEnroll,
    isLoading: enrollmentsLoading || enrollMutation.isLoading || unenrollMutation.isLoading,
    enroll,
    unenroll,
    enrollmentStatus,
    enrollments
  };
};