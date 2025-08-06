import { useMutation, useQueryClient, UseMutationOptions } from '@tanstack/react-query';
import { QueryKeys, request } from 'librechat-data-provider';

// Re-export specialized mutations
export * from './moduleMutations';
export * from './forumMutations';

// Progress mutations
export const useUpdateLessonProgressMutation = (
  options?: UseMutationOptions<any, Error, any>
) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { lessonId: string; progress: any }) => {
      // Mock success
      return Promise.resolve({ success: true });
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: [QueryKeys.lessonProgress, variables.lessonId] });
      queryClient.invalidateQueries({ queryKey: [QueryKeys.courseProgress] });
    },
    ...options,
  });
};

export const useMarkLessonCompleteMutation = (
  options?: UseMutationOptions<any, Error, any>
) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { lessonId: string }) => {
      // Mock success
      return Promise.resolve({ success: true });
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: [QueryKeys.lessonProgress, variables.lessonId] });
      queryClient.invalidateQueries({ queryKey: [QueryKeys.courseProgress] });
    },
    ...options,
  });
};

// Course mutations
export const useEnrollInCourseMutation = (
  options?: UseMutationOptions<any, Error, any>
) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { courseId: string }) => {
      // Mock success
      return Promise.resolve({ success: true });
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: [QueryKeys.userEnrollments] });
      queryClient.invalidateQueries({ queryKey: [QueryKeys.course, variables.courseId] });
    },
    ...options,
  });
};

export const useUnenrollFromCourseMutation = (
  options?: UseMutationOptions<any, Error, any>
) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { courseId: string }) => {
      // Mock success
      return Promise.resolve({ success: true });
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: [QueryKeys.userEnrollments] });
      queryClient.invalidateQueries({ queryKey: [QueryKeys.course, variables.courseId] });
    },
    ...options,
  });
};

// Admin mutations
export const useCreateCourseMutation = (
  options?: UseMutationOptions<any, Error, any>
) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: any) => {
      // Mock success
      return Promise.resolve({ _id: 'new-course', ...data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QueryKeys.courses] });
      queryClient.invalidateQueries({ queryKey: [QueryKeys.adminCourses] });
    },
    ...options,
  });
};

export const useUpdateCourseMutation = (
  options?: UseMutationOptions<any, Error, any>
) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { courseId: string; updates: any }) => {
      // Mock success
      return Promise.resolve({ success: true });
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: [QueryKeys.course, variables.courseId] });
      queryClient.invalidateQueries({ queryKey: [QueryKeys.courses] });
      queryClient.invalidateQueries({ queryKey: [QueryKeys.adminCourses] });
    },
    ...options,
  });
};

export const useDeleteCourseMutation = (
  options?: UseMutationOptions<any, Error, any>
) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { courseId: string }) => {
      // Mock success
      return Promise.resolve({ success: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QueryKeys.courses] });
      queryClient.invalidateQueries({ queryKey: [QueryKeys.adminCourses] });
    },
    ...options,
  });
};

export const usePublishCourseMutation = (
  options?: UseMutationOptions<any, Error, any>
) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { courseId: string; isPublished: boolean }) => {
      // Mock success
      return Promise.resolve({ success: true });
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: [QueryKeys.course, variables.courseId] });
      queryClient.invalidateQueries({ queryKey: [QueryKeys.courses] });
      queryClient.invalidateQueries({ queryKey: [QueryKeys.adminCourses] });
    },
    ...options,
  });
};