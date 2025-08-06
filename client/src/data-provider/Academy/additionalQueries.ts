import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { QueryKeys, request } from 'librechat-data-provider';
import { mockUserEnrollments, mockCourses } from './mockData';

export const useGetUserEnrollmentsQuery = (
  userId: string,
  options?: UseQueryOptions<any>
): ReturnType<typeof useQuery<any>> => {
  return useQuery<any>({
    queryKey: [QueryKeys.userEnrollments, userId],
    queryFn: async () => {
      // Use mock data for now
      return Promise.resolve(mockUserEnrollments);
    },
    enabled: !!userId,
    ...options,
  });
};

export const useGetAdminCoursesQuery = (
  options?: UseQueryOptions<any>
): ReturnType<typeof useQuery<any>> => {
  return useQuery<any>({
    queryKey: [QueryKeys.adminCourses],
    queryFn: async () => {
      // Use mock data for now - same as regular courses for admin
      return Promise.resolve(mockCourses.courses);
    },
    ...options,
  });
};

export const useGetForumPostsQuery = ({
  categoryId,
  search,
  sortBy,
  limit = 20
}: {
  categoryId?: string | null;
  search?: string;
  sortBy?: string;
  limit?: number;
} = {}): ReturnType<typeof useQuery<any>> => {
  return useQuery<any>({
    queryKey: [QueryKeys.forumPosts, categoryId, search, sortBy, limit],
    queryFn: async () => {
      try {
        const params = new URLSearchParams();
        if (categoryId) params.append('categoryId', categoryId);
        if (search) params.append('search', search);
        if (sortBy) params.append('sortBy', sortBy);
        params.append('limit', limit.toString());
        
        const url = `/api/lms/forum/posts?${params.toString()}`;
        console.log('[ForumPosts] Making API request to:', url);
        const response = await request.get(url);
        console.log('[ForumPosts] API response:', response);
        return { pages: [response] };
      } catch (error) {
        console.error('[ForumPosts] API call failed:', error);
        // Return empty data on error
        return { pages: [{ posts: [], totalCount: 0 }] };
      }
    },
    ...{},
  });
};

export const useGetForumPostQuery = (
  postId: string,
  options?: UseQueryOptions<any>
): ReturnType<typeof useQuery<any>> => {
  return useQuery<any>({
    queryKey: [QueryKeys.forumPost, postId],
    queryFn: async () => {
      try {
        const response = await request.get(`/api/lms/forum/posts/${postId}`);
        return response.data;
      } catch (error) {
        console.error('Failed to fetch forum post:', error);
        return null;
      }
    },
    enabled: !!postId,
    ...options,
  });
};

export const useGetLessonProgressQuery = (
  lessonId: string,
  options?: UseQueryOptions<any>
): ReturnType<typeof useQuery<any>> => {
  return useQuery<any>({
    queryKey: [QueryKeys.lessonProgress, lessonId],
    queryFn: async () => {
      // Use mock data for now
      return Promise.resolve(lessonId === 'lesson1' ? { lastPosition: 120, percentComplete: 20 } : null);
    },
    enabled: !!lessonId,
    ...options,
  });
};