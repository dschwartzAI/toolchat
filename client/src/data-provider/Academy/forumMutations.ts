import { useMutation, useQueryClient, UseMutationOptions } from '@tanstack/react-query';
import { QueryKeys } from 'librechat-data-provider';
import request from '~/data-provider/request';

// Forum Post Mutations

export const useUpdatePostMutation = (
  options?: UseMutationOptions<any, Error, any>
) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ postId, updates }: { postId: string; updates: any }) => {
      const response = await request.put(`/api/lms/forum/posts/${postId}`, updates);
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: [QueryKeys.forumPost, variables.postId] });
      queryClient.invalidateQueries({ queryKey: [QueryKeys.forumPosts] });
    },
    ...options,
  });
};

export const useDeletePostMutation = (
  options?: UseMutationOptions<any, Error, any>
) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (postId: string) => {
      const response = await request.delete(`/api/lms/forum/posts/${postId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QueryKeys.forumPosts] });
    },
    ...options,
  });
};

export const useRestorePostMutation = (
  options?: UseMutationOptions<any, Error, any>
) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (postId: string) => {
      const response = await request.post(`/api/lms/forum/posts/${postId}/restore`);
      return response.data;
    },
    onSuccess: (data, postId) => {
      queryClient.invalidateQueries({ queryKey: [QueryKeys.forumPost, postId] });
      queryClient.invalidateQueries({ queryKey: [QueryKeys.forumPosts] });
    },
    ...options,
  });
};

export const usePinPostMutation = (
  options?: UseMutationOptions<any, Error, any>
) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (postId: string) => {
      const response = await request.post(`/api/lms/forum/posts/${postId}/pin`);
      return response.data;
    },
    onSuccess: (data, postId) => {
      queryClient.invalidateQueries({ queryKey: [QueryKeys.forumPost, postId] });
      queryClient.invalidateQueries({ queryKey: [QueryKeys.forumPosts] });
    },
    ...options,
  });
};

export const useLockPostMutation = (
  options?: UseMutationOptions<any, Error, any>
) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (postId: string) => {
      const response = await request.post(`/api/lms/forum/posts/${postId}/lock`);
      return response.data;
    },
    onSuccess: (data, postId) => {
      queryClient.invalidateQueries({ queryKey: [QueryKeys.forumPost, postId] });
      queryClient.invalidateQueries({ queryKey: [QueryKeys.forumPosts] });
    },
    ...options,
  });
};

export const useBulkDeletePostsMutation = (
  options?: UseMutationOptions<any, Error, any>
) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (postIds: string[]) => {
      const response = await request.post('/api/lms/forum/posts/bulk/delete', { postIds });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QueryKeys.forumPosts] });
    },
    ...options,
  });
};

// Forum Reply Mutations

export const useUpdateReplyMutation = (
  options?: UseMutationOptions<any, Error, any>
) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ replyId, content }: { replyId: string; content: string }) => {
      const response = await request.put(`/api/lms/forum/replies/${replyId}`, { content });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QueryKeys.forumPost] });
    },
    ...options,
  });
};

export const useDeleteReplyMutation = (
  options?: UseMutationOptions<any, Error, any>
) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (replyId: string) => {
      const response = await request.delete(`/api/lms/forum/replies/${replyId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QueryKeys.forumPost] });
    },
    ...options,
  });
};

// Moderation Stats Query

export const useGetModerationStatsQuery = () => {
  return {
    queryKey: ['moderationStats'],
    queryFn: async () => {
      const response = await request.get('/api/lms/forum/moderation/stats');
      return response.data;
    },
  };
};

// Enhanced Forum Post Creation with proper error handling

export const useCreateForumPostMutation = (
  options?: UseMutationOptions<any, Error, any>
) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: {
      title: string;
      content: string;
      categoryId: string;
      tags?: string[];
    }) => {
      const response = await request.post('/api/lms/forum/posts', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QueryKeys.forumPosts] });
    },
    ...options,
  });
};

export const useCreateForumReplyMutation = (
  options?: UseMutationOptions<any, Error, any>
) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ postId, content, parentReplyId }: {
      postId: string;
      content: string;
      parentReplyId?: string;
    }) => {
      const response = await request.post(`/api/lms/forum/posts/${postId}/replies`, {
        content,
        parentReplyId,
      });
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: [QueryKeys.forumPost, variables.postId] });
    },
    ...options,
  });
};