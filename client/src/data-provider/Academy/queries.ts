import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { QueryKeys, request } from 'librechat-data-provider';
import type { TGetCoursesResponse, TGetModulesResponse } from './types';
import { 
  mockCourses, 
  mockForumCategories, 
  mockForumPosts, 
  mockCourseProgress,
  mockLessonProgress,
  mockUserEnrollments 
} from './mockData';
import { mockModules } from './mockModules';

export const useGetModulesQuery = (
  options?: UseQueryOptions<TGetModulesResponse>
): ReturnType<typeof useQuery<TGetModulesResponse>> => {
  return useQuery<TGetModulesResponse>({
    queryKey: [QueryKeys.modules],
    queryFn: async () => {
      // Use mock data for now
      return Promise.resolve(mockModules as TGetModulesResponse);
      // Future: return request.get('/api/lms/modules').then((res) => res.data);
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
      return response.data;
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
      // Use mock data for now
      return Promise.resolve(mockCourses as TGetCoursesResponse);
      // Original: return request.get('/api/lms/courses').then((res) => res.data);
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
      // Use mock data for now
      const course = mockCourses.courses.find(c => c._id === courseId);
      return Promise.resolve(course);
      // Original: return request.get(`/api/lms/courses/${courseId}`).then((res) => res.data);
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
      // Use mock data for now - find lesson in courses
      for (const course of mockCourses.courses) {
        for (const module of course.modules || []) {
          const lesson = module.lessons?.find(l => l._id === lessonId);
          if (lesson) {
            return Promise.resolve(lesson);
          }
        }
      }
      return Promise.resolve(null);
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
      // Use mock data for now
      return Promise.resolve(mockCourseProgress);
      // Original: return request.get(`/api/lms/progress/course/${courseId}`).then((res) => res.data);
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
        console.log('[ForumCategories] Making API request to /api/lms/forum/categories');
        const response = await request.get('/api/lms/forum/categories');
        console.log('[ForumCategories] API response:', response);
        
        if (response && Array.isArray(response)) {
          return response;
        }
        
        console.warn('[ForumCategories] API returned unexpected response format, using fallback');
        return fallbackCategories;
      } catch (error) {
        console.error('[ForumCategories] API call failed:', error);
        return fallbackCategories;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
};