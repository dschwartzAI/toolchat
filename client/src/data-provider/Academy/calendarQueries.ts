import { useQuery } from '@tanstack/react-query';
import { QueryKeys, request } from 'librechat-data-provider';

// Calendar event types
export interface CalendarEvent {
  _id: string;
  title: string;
  description: string;
  event_type: 'office_hours' | 'community_call' | 'workshop' | 'coaching';
  start_datetime: string;
  duration_minutes: number;
  timezone?: string;
  meeting_link?: string;
  meeting_provider?: string;
  is_recurring?: boolean;
  recurrence_pattern?: {
    frequency: string;
    interval: number;
    days_of_week?: number[];
    end_type: string;
    occurrences?: number;
    end_date?: string;
  };
  parent_event_id?: string;
  is_occurrence?: boolean;
  created_by_admin_id?: string;
  created_at?: string;
  updated_at?: string;
}

// Get calendar events for a specific month
export const useGetCalendarEvents = (year: number, month: number) => {
  return useQuery<{ events: CalendarEvent[] }>({
    queryKey: [QueryKeys.calendarEvents, year, month],
    queryFn: async () => {
      console.log('[Calendar] Fetching events for:', { year, month });
      const response = await request.get(`/api/lms/calendar/events?year=${year}&month=${month}`);
      console.log('[Calendar] Events response:', response);
      return response;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Get upcoming events
export const useGetUpcomingEvents = (limit: number = 10) => {
  return useQuery<{ events: CalendarEvent[] }>({
    queryKey: [QueryKeys.upcomingEvents, limit],
    queryFn: () => request.get(`/api/lms/calendar/events/upcoming?limit=${limit}`),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

// Get events in a date range
export const useGetEventsInRange = (startDate: string, endDate: string) => {
  return useQuery<{ events: CalendarEvent[] }>({
    queryKey: [QueryKeys.calendarEventsRange, startDate, endDate],
    queryFn: () => request.get(`/api/lms/calendar/events/range?start=${startDate}&end=${endDate}`),
    enabled: !!startDate && !!endDate,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

// Get single event details
export const useGetEventById = (eventId: string) => {
  return useQuery<{ event: CalendarEvent }>({
    queryKey: [QueryKeys.calendarEvent, eventId],
    queryFn: () => request.get(`/api/lms/calendar/events/${eventId}`),
    enabled: !!eventId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

// Admin: Get all events
export const useGetAllEvents = () => {
  return useQuery<{ events: CalendarEvent[] }>({
    queryKey: [QueryKeys.allCalendarEvents],
    queryFn: () => request.get('/api/lms/calendar/admin/events'),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

// Admin: Get event templates
export const useGetEventTemplates = () => {
  return useQuery<{ templates: Record<string, any> }>({
    queryKey: [QueryKeys.eventTemplates],
    queryFn: () => request.get('/api/lms/calendar/admin/templates'),
    staleTime: 30 * 60 * 1000, // 30 minutes - templates don't change often
    gcTime: 60 * 60 * 1000, // 1 hour
  });
};