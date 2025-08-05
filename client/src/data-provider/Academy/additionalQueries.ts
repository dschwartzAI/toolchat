import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { QueryKeys } from 'librechat-data-provider';
import { mockUserEnrollments, mockCourses, mockForumPosts } from './mockData';

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
      // Use mock data for now
      return Promise.resolve({ pages: [mockForumPosts] });
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
      // Use mock data for now
      const post = mockForumPosts.posts.find(p => p._id === postId);
      return Promise.resolve({
        ...post,
        replies: []
      });
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