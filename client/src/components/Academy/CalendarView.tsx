import React, { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, startOfWeek, endOfWeek, addMonths, subMonths, isToday, parseISO } from 'date-fns';
import { ChevronLeft, ChevronRight, Clock, MapPin, Users, Video, Calendar as CalendarIcon, Plus } from 'lucide-react';
import { useGetCalendarEvents } from '~/data-provider/Academy';
import EventModal from './EventModal';
import AdminEventModal from './AdminEventModal';
import { useAuthContext } from '~/hooks/AuthContext';
import { cn } from '~/utils';

interface CalendarEvent {
  _id: string;
  title: string;
  description: string;
  event_type: 'office_hours' | 'community_call' | 'workshop' | 'coaching';
  start_datetime: string;
  duration_minutes: number;
  meeting_link?: string;
  meeting_provider?: string;
  is_recurring?: boolean;
  is_occurrence?: boolean;
  parent_event_id?: string;
}

const CalendarView: React.FC = () => {
  const { user } = useAuthContext();
  // Check for admin role - could be 'admin' or user might have isAdmin flag
  const isAdmin = user?.role === 'admin' || user?.isAdmin === true || user?.email === 'dschwartz06@gmail.com';
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Fetch events for current month
  const { data: eventsData, isLoading, refetch } = useGetCalendarEvents(year, month);
  const events = eventsData?.events || [];

  // Get calendar days for the month view
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  // Group events by date
  const eventsByDate = events.reduce((acc: Record<string, CalendarEvent[]>, event) => {
    const dateKey = format(parseISO(event.start_datetime), 'yyyy-MM-dd');
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(event);
    return acc;
  }, {});

  // Navigation handlers
  const goToPreviousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Event type colors and icons
  const getEventTypeStyle = (type: string) => {
    switch (type) {
      case 'office_hours':
        return {
          bgColor: 'bg-blue-100 dark:bg-blue-900/30',
          textColor: 'text-blue-700 dark:text-blue-400',
          borderColor: 'border-blue-300 dark:border-blue-700',
          icon: Clock,
        };
      case 'community_call':
        return {
          bgColor: 'bg-green-100 dark:bg-green-900/30',
          textColor: 'text-green-700 dark:text-green-400',
          borderColor: 'border-green-300 dark:border-green-700',
          icon: Users,
        };
      case 'workshop':
        return {
          bgColor: 'bg-purple-100 dark:bg-purple-900/30',
          textColor: 'text-purple-700 dark:text-purple-400',
          borderColor: 'border-purple-300 dark:border-purple-700',
          icon: Video,
        };
      case 'coaching':
        return {
          bgColor: 'bg-orange-100 dark:bg-orange-900/30',
          textColor: 'text-orange-700 dark:text-orange-400',
          borderColor: 'border-orange-300 dark:border-orange-700',
          icon: Users,
        };
      default:
        return {
          bgColor: 'bg-gray-100 dark:bg-gray-800',
          textColor: 'text-gray-700 dark:text-gray-400',
          borderColor: 'border-gray-300 dark:border-gray-700',
          icon: CalendarIcon,
        };
    }
  };

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setShowEventModal(true);
  };

  const handleCreateEvent = (date?: Date) => {
    console.log('handleCreateEvent called', { isAdmin, user, date });
    if (isAdmin) {
      setSelectedDate(date || new Date());
      setSelectedEvent(null);
      setShowAdminModal(true);
    } else {
      console.log('Not admin - cannot create events', { role: user?.role, isAdmin: user?.isAdmin, email: user?.email });
    }
  };

  const handleEditEvent = () => {
    console.log('[CalendarView] handleEditEvent - selectedEvent:', selectedEvent);
    console.log('[CalendarView] handleEditEvent - selectedEvent._id:', selectedEvent?._id);
    setShowEventModal(false);
    setShowAdminModal(true);
    // selectedEvent is already set from handleEventClick
  };

  const handleEventDeleted = () => {
    // Refresh the calendar after deletion
    refetch();
  };

  return (
    <div className="flex h-full flex-col bg-white dark:bg-gray-900 rounded-lg shadow-sm">
      {/* Calendar Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {format(currentDate, 'MMMM yyyy')}
          </h2>
          <div className="flex items-center gap-1">
            <button
              onClick={goToPreviousMonth}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
              aria-label="Previous month"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            <button
              onClick={goToToday}
              className="px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
            >
              Today
            </button>
            <button
              onClick={goToNextMonth}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
              aria-label="Next month"
            >
              <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        </div>
        
        {isAdmin && (
          <button
            onClick={() => handleCreateEvent()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Event
          </button>
        )}
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 p-4 overflow-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-gray-500 dark:text-gray-400">Loading calendar...</div>
          </div>
        ) : (
          <div className="h-full">
            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-px mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div
                  key={day}
                  className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 py-2"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-700 border border-gray-200 dark:border-gray-700">
              {calendarDays.map((day) => {
                const dateKey = format(day, 'yyyy-MM-dd');
                const dayEvents = eventsByDate[dateKey] || [];
                const isCurrentMonth = isSameMonth(day, currentDate);
                const isCurrentDay = isToday(day);
                
                return (
                  <div
                    key={day.toISOString()}
                    className={cn(
                      'min-h-[100px] bg-white dark:bg-gray-900 p-2',
                      !isCurrentMonth && 'bg-gray-50 dark:bg-gray-800/50',
                      isCurrentDay && 'bg-blue-50 dark:bg-blue-900/20',
                      isAdmin && 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/70'
                    )}
                    onClick={() => isAdmin && handleCreateEvent(day)}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span
                        className={cn(
                          'text-sm font-medium',
                          isCurrentMonth
                            ? 'text-gray-900 dark:text-gray-100'
                            : 'text-gray-400 dark:text-gray-600',
                          isCurrentDay && 'text-blue-600 dark:text-blue-400'
                        )}
                      >
                        {format(day, 'd')}
                      </span>
                    </div>
                    
                    {/* Event list */}
                    <div className="space-y-1">
                      {dayEvents.slice(0, 3).map((event) => {
                        const style = getEventTypeStyle(event.event_type);
                        const Icon = style.icon;
                        const eventTime = format(parseISO(event.start_datetime), 'h:mm a');
                        
                        return (
                          <div
                            key={event._id}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEventClick(event);
                            }}
                            className={cn(
                              'px-1.5 py-0.5 rounded text-xs cursor-pointer transition-opacity hover:opacity-80',
                              style.bgColor,
                              style.textColor,
                              'border',
                              style.borderColor
                            )}
                          >
                            <div className="flex items-center gap-1">
                              <Icon className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate font-medium">
                                {eventTime}
                              </span>
                            </div>
                            <div className="truncate">
                              {event.title}
                            </div>
                          </div>
                        );
                      })}
                      {dayEvents.length > 3 && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 pl-1">
                          +{dayEvents.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Event Details Modal */}
      {showEventModal && selectedEvent && (
        <EventModal
          event={selectedEvent}
          isOpen={showEventModal}
          onClose={() => {
            setShowEventModal(false);
            setSelectedEvent(null);
          }}
          isAdmin={isAdmin}
          onEdit={handleEditEvent}
          onDeleted={handleEventDeleted}
        />
      )}

      {/* Admin Event Management Modal */}
      {showAdminModal && isAdmin && (
        <AdminEventModal
          event={selectedEvent}
          defaultDate={selectedDate}
          isOpen={showAdminModal}
          onClose={() => {
            setShowAdminModal(false);
            setSelectedEvent(null);
            setSelectedDate(null);
          }}
          onSave={() => {
            refetch();
            setShowAdminModal(false);
            setSelectedEvent(null);
            setSelectedDate(null);
          }}
        />
      )}
    </div>
  );
};

export default CalendarView;