import { useMutation, useQueryClient, UseMutationOptions } from '@tanstack/react-query';
import { QueryKeys, request } from 'librechat-data-provider';

// Forum Post Mutations

export const useUpdatePostMutation = (
  options?: UseMutationOptions<any, Error, any>
) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ postId, updates }: { postId: string; updates: any }) => {
      const response = await request.put(`/api/lms/forum/posts/${postId}`, updates);
      return response;
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
      try {
        console.log('[forumMutations] Deleting post:', postId);
        const response = await request.delete(`/api/lms/forum/posts/${postId}`);
        console.log('[forumMutations] Delete response:', response);
        return response;
      } catch (error) {
        console.error('[forumMutations] Delete error:', error);
        throw error;
      }
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
      return response;
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
      return response;
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
      return response;
    },
    onSuccess: (data, postId) => {
      queryClient.invalidateQueries({ queryKey: [QueryKeys.forumPost, postId] });
      queryClient.invalidateQueries({ queryKey: [QueryKeys.forumPosts] });
    },
    ...options,
  });
};

export const useLikePostMutation = (
  options?: UseMutationOptions<any, Error, any>
) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (postId: string) => {
      const response = await request.post(`/api/lms/forum/posts/${postId}/like`);
      return response;
    },
    onSuccess: (data, postId) => {
      queryClient.invalidateQueries({ queryKey: [QueryKeys.forumPost, postId] });
      queryClient.invalidateQueries({ queryKey: [QueryKeys.forumPosts] });
    },
    ...options,
  });
};

export const useLikeReplyMutation = (
  options?: UseMutationOptions<any, Error, any>
) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ postId, replyId }: { postId: string; replyId: string }) => {
      const response = await request.post(`/api/lms/forum/posts/${postId}/replies/${replyId}/like`);
      return response;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: [QueryKeys.forumPost, variables.postId] });
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
      return response;
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
      return response;
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
      return response;
    },
    onSuccess: () => {
      // Invalidate both the posts list and individual post queries
      queryClient.invalidateQueries({ queryKey: [QueryKeys.forumPosts] });
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
      return response;
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
      try {
        console.log('[forumMutations] Creating post with data:', data);
        const response = await request.post('/api/lms/forum/posts', data);
        console.log('[forumMutations] Create post response:', response);
        return response;
      } catch (error: any) {
        console.error('[forumMutations] Create post error:', error);
        console.error('[forumMutations] Error response:', error.response?.data);
        throw error;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [QueryKeys.forumPosts] });
      // Call the custom onSuccess handler if provided
      if (options?.onSuccess) {
        options.onSuccess(data);
      }
    },
    onError: (error) => {
      // Call the custom onError handler if provided
      if (options?.onError) {
        options.onError(error);
      }
    }
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
      return response;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: [QueryKeys.forumPost, variables.postId] });
    },
    ...options,
  });
};