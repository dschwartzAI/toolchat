import { useMutation, useQueryClient, UseMutationOptions } from '@tanstack/react-query';
import { QueryKeys } from 'librechat-data-provider';
import request from '~/data-provider/request';

// Module CRUD Mutations

export const useCreateModuleMutation = (
  options?: UseMutationOptions<any, Error, any>
) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: any) => {
      const response = await request.post('/api/lms/modules', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modules'] });
    },
    ...options,
  });
};

export const useUpdateModuleMutation = (
  options?: UseMutationOptions<any, Error, any>
) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ moduleId, updates }: { moduleId: string; updates: any }) => {
      const response = await request.put(`/api/lms/modules/${moduleId}`, updates);
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['module', variables.moduleId] });
      queryClient.invalidateQueries({ queryKey: ['modules'] });
    },
    ...options,
  });
};

export const useDeleteModuleMutation = (
  options?: UseMutationOptions<any, Error, any>
) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (moduleId: string) => {
      const response = await request.delete(`/api/lms/modules/${moduleId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modules'] });
    },
    ...options,
  });
};

export const useRestoreModuleMutation = (
  options?: UseMutationOptions<any, Error, any>
) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (moduleId: string) => {
      const response = await request.post(`/api/lms/modules/${moduleId}/restore`);
      return response.data;
    },
    onSuccess: (data, moduleId) => {
      queryClient.invalidateQueries({ queryKey: ['module', moduleId] });
      queryClient.invalidateQueries({ queryKey: ['modules'] });
    },
    ...options,
  });
};

export const useReorderModulesMutation = (
  options?: UseMutationOptions<any, Error, any>
) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (moduleOrders: Array<{ moduleId: string; order: number }>) => {
      const response = await request.post('/api/lms/modules/reorder', { moduleOrders });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modules'] });
    },
    ...options,
  });
};

export const useUploadThumbnailMutation = (
  options?: UseMutationOptions<any, Error, any>
) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ moduleId, file }: { moduleId: string; file: File }) => {
      const formData = new FormData();
      formData.append('thumbnail', file);
      
      const response = await request.post(
        `/api/lms/modules/${moduleId}/thumbnail`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['module', variables.moduleId] });
      queryClient.invalidateQueries({ queryKey: ['modules'] });
    },
    ...options,
  });
};

export const useBulkPublishMutation = (
  options?: UseMutationOptions<any, Error, any>
) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ moduleIds, isPublished }: { moduleIds: string[]; isPublished: boolean }) => {
      const response = await request.post('/api/lms/modules/bulk/publish', {
        moduleIds,
        isPublished,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modules'] });
    },
    ...options,
  });
};

// Module queries
export const useGetModulesQuery = (includeDeleted = false) => {
  return {
    queryKey: ['modules', { includeDeleted }],
    queryFn: async () => {
      const response = await request.get('/api/lms/modules', {
        params: { includeDeleted },
      });
      return response.data;
    },
  };
};

export const useGetModuleQuery = (moduleId: string) => {
  return {
    queryKey: ['module', moduleId],
    queryFn: async () => {
      const response = await request.get(`/api/lms/modules/${moduleId}`);
      return response.data;
    },
    enabled: !!moduleId,
  };
};