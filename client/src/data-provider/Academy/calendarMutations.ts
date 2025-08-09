import { useMutation, useQueryClient } from '@tanstack/react-query';
import { QueryKeys, request } from 'librechat-data-provider';
import type { CalendarEvent } from './calendarQueries';

// Create event mutation
export const useCreateCalendarEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (eventData: Partial<CalendarEvent> & { template?: string }) => 
      request.post('/api/lms/calendar/admin/events', eventData),
    onSuccess: () => {
      // Invalidate calendar queries to refetch
      queryClient.invalidateQueries({ queryKey: [QueryKeys.calendarEvents] });
      queryClient.invalidateQueries({ queryKey: [QueryKeys.upcomingEvents] });
      queryClient.invalidateQueries({ queryKey: [QueryKeys.allCalendarEvents] });
    },
  });
};

// Create event from template mutation
export const useCreateEventFromTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { template: string } & Partial<CalendarEvent>) => 
      request.post('/api/lms/calendar/admin/events/from-template', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QueryKeys.calendarEvents] });
      queryClient.invalidateQueries({ queryKey: [QueryKeys.upcomingEvents] });
      queryClient.invalidateQueries({ queryKey: [QueryKeys.allCalendarEvents] });
    },
  });
};

// Update event mutation
export const useUpdateCalendarEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ 
      id, 
      data, 
      updateSeries = false 
    }: { 
      id: string; 
      data: Partial<CalendarEvent>; 
      updateSeries?: boolean 
    }) => 
      request.put(`/api/lms/calendar/admin/events/${id}?updateSeries=${updateSeries}`, data),
    onSuccess: (_, variables) => {
      // Invalidate specific event and all calendar queries
      queryClient.invalidateQueries({ queryKey: [QueryKeys.calendarEvent, variables.id] });
      queryClient.invalidateQueries({ queryKey: [QueryKeys.calendarEvents] });
      queryClient.invalidateQueries({ queryKey: [QueryKeys.upcomingEvents] });
      queryClient.invalidateQueries({ queryKey: [QueryKeys.allCalendarEvents] });
    },
  });
};

// Delete event mutation
export const useDeleteCalendarEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ 
      id, 
      deleteSeries = false,
      occurrenceDate,
    }: { 
      id: string; 
      deleteSeries?: boolean;
      occurrenceDate?: string;
    }) => {
      const params = new URLSearchParams();
      params.set('deleteSeries', String(!!deleteSeries));
      if (occurrenceDate) params.set('occurrenceDate', occurrenceDate);
      return request.delete(`/api/lms/calendar/admin/events/${id}?${params.toString()}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QueryKeys.calendarEvents] });
      queryClient.invalidateQueries({ queryKey: [QueryKeys.upcomingEvents] });
      queryClient.invalidateQueries({ queryKey: [QueryKeys.allCalendarEvents] });
    },
  });
};