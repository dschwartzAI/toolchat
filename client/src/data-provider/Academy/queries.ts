import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { QueryKeys, request } from 'librechat-data-provider';
import type { TGetCoursesResponse, TGetModulesResponse } from './types';

export const useGetModulesQuery = (
  options?: UseQueryOptions<TGetModulesResponse>
): ReturnType<typeof useQuery<TGetModulesResponse>> => {
  return useQuery<TGetModulesResponse>({
    queryKey: [QueryKeys.modules],
    queryFn: async () => {
      const response = await request.get('/api/lms/modules');
      return response;
    },
    ...options,
  });
};

export const useGetModuleQuery = (
  moduleId: string,
  options?: UseQueryOptions<any>
): ReturnType<typeof useQuery<any>> => {
  return useQuery<any>({
    queryKey: ['module', moduleId],
    queryFn: async () => {
      const response = await request.get(`/api/lms/modules/${moduleId}`);
      return response;
    },
    enabled: !!moduleId,
    ...options,
  });
};

export const useGetCoursesQuery = (
  options?: UseQueryOptions<TGetCoursesResponse>
): ReturnType<typeof useQuery<TGetCoursesResponse>> => {
  return useQuery<TGetCoursesResponse>({
    queryKey: [QueryKeys.courses],
    queryFn: async () => {
      return request.get('/api/lms/courses');
    },
    ...options,
  });
};

export const useGetCourseQuery = (
  courseId: string,
  options?: UseQueryOptions<any>
): ReturnType<typeof useQuery<any>> => {
  return useQuery<any>({
    queryKey: [QueryKeys.course, courseId],
    queryFn: async () => {
      return request.get(`/api/lms/courses/${courseId}`);
    },
    enabled: !!courseId,
    ...options,
  });
};

export const useGetLessonQuery = (
  lessonId: string,
  options?: UseQueryOptions<any>
): ReturnType<typeof useQuery<any>> => {
  return useQuery<any>({
    queryKey: [QueryKeys.lesson, lessonId],
    queryFn: async () => {
      return request.get(`/api/lms/lessons/${lessonId}`);
    },
    enabled: !!lessonId,
    ...options,
  });
};


export const useGetCourseProgressQuery = (
  courseId: string,
  options?: UseQueryOptions<any>
): ReturnType<typeof useQuery<any>> => {
  return useQuery<any>({
    queryKey: [QueryKeys.courseProgress, courseId],
    queryFn: async () => {
      return request.get(`/api/lms/progress/course/${courseId}`);
    },
    enabled: !!courseId,
    ...options,
  });
};

export const useGetForumCategoriesQuery = (
  options?: UseQueryOptions<any>
): ReturnType<typeof useQuery<any>> => {
  return useQuery<any>({
    queryKey: [QueryKeys.forumCategories],
    queryFn: async () => {
      const fallbackCategories = [
        { _id: 'general', name: 'General Discussion', description: 'General topics and discussions' },
        { _id: 'questions', name: 'Questions', description: 'Ask questions and get help' },
        { _id: 'resources', name: 'Resources', description: 'Share resources and tools' }
      ];
      
      try {
        const response = await request.get('/api/lms/forum/categories');
        
        if (response && Array.isArray(response)) {
          return response;
        }
        
        return fallbackCategories;
      } catch (error) {
        return fallbackCategories;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
};