import React, { useState, useCallback } from 'react';
import { format, parseISO } from 'date-fns';
import { Clock, Calendar, Video, MapPin, Users, Link as LinkIcon, Repeat, Edit, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '~/components/ui';
import { useDeleteCalendarEvent } from '~/data-provider/Academy';
import { useToastContext } from '~/Providers';
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
  timezone?: string;
}

interface EventModalProps {
  event: CalendarEvent;
  isOpen: boolean;
  onClose: () => void;
  isAdmin?: boolean;
  onEdit?: () => void;
  onDeleted?: () => void;
}

const EventModal: React.FC<EventModalProps> = ({ event, isOpen, onClose, isAdmin, onEdit, onDeleted }) => {
  const { showToast } = useToastContext();
  const deleteEventMutation = useDeleteCalendarEvent();
  const [isDeleting, setIsDeleting] = useState(false);
  
  console.log('[EventModal] Component state:', { isAdmin, eventId: event?._id });
  
  const startDate = parseISO(event.start_datetime);
  const endDate = new Date(startDate.getTime() + event.duration_minutes * 60000);

  // Event type styling
  const getEventTypeStyle = (type: string) => {
    switch (type) {
      case 'office_hours':
        return {
          bgColor: 'bg-blue-100 dark:bg-blue-900/30',
          textColor: 'text-blue-700 dark:text-blue-400',
          borderColor: 'border-blue-300 dark:border-blue-700',
          label: 'Office Hours',
          icon: Clock,
        };
      case 'community_call':
        return {
          bgColor: 'bg-green-100 dark:bg-green-900/30',
          textColor: 'text-green-700 dark:text-green-400',
          borderColor: 'border-green-300 dark:border-green-700',
          label: 'Community Call',
          icon: Users,
        };
      case 'workshop':
        return {
          bgColor: 'bg-purple-100 dark:bg-purple-900/30',
          textColor: 'text-purple-700 dark:text-purple-400',
          borderColor: 'border-purple-300 dark:border-purple-700',
          label: 'Workshop',
          icon: Video,
        };
      case 'coaching':
        return {
          bgColor: 'bg-orange-100 dark:bg-orange-900/30',
          textColor: 'text-orange-700 dark:text-orange-400',
          borderColor: 'border-orange-300 dark:border-orange-700',
          label: 'Group Coaching',
          icon: Users,
        };
      default:
        return {
          bgColor: 'bg-gray-100 dark:bg-gray-800',
          textColor: 'text-gray-700 dark:text-gray-400',
          borderColor: 'border-gray-300 dark:border-gray-700',
          label: 'Event',
          icon: Calendar,
        };
    }
  };

  const style = getEventTypeStyle(event.event_type);
  const Icon = style.icon;

  const handleJoinMeeting = () => {
    if (event.meeting_link) {
      window.open(event.meeting_link, '_blank', 'noopener,noreferrer');
    }
  };
  
  const handleDelete = useCallback(async (shouldDeleteSeries: boolean = false) => {
    // Determine the correct ID to use for deletion
    // For recurring occurrences, use parent_event_id; for regular events, use _id
    const deleteId = event.is_occurrence ? event.parent_event_id : event._id;
    const occurrenceDate = event.is_occurrence
      ? new Date(event.start_datetime).toISOString().slice(0, 10)
      : undefined;
    
    console.log('[EventModal] Starting delete with:', { 
      eventId: deleteId, 
      isOccurrence: event.is_occurrence,
      parentEventId: event.parent_event_id,
      deleteSeries: shouldDeleteSeries 
    });
    console.log('[EventModal] Delete mutation available:', !!deleteEventMutation);
    
    // Check if we have a valid ID
    if (!deleteId) {
      console.error('[EventModal] No valid ID for deletion!', { event });
      showToast({
        message: 'Unable to delete: Event ID is missing',
        status: 'error',
      });
      return;
    }
    
    // Check if mutation is available
    if (!deleteEventMutation) {
      console.error('[EventModal] Delete mutation not available!');
      return;
    }
    
    setIsDeleting(true);
    try {
      console.log('[EventModal] Calling delete mutation with ID:', deleteId);
      const result = await deleteEventMutation.mutateAsync({
        id: deleteId,
        deleteSeries: shouldDeleteSeries,
        occurrenceDate,
      });
      console.log('[EventModal] Delete successful:', result);
      showToast({
        message: `Event${shouldDeleteSeries && (event.is_occurrence || event.parent_event_id) ? ' series' : ''} deleted successfully`,
        status: 'success',
      });
      onClose();
      if (onDeleted) {
        onDeleted();
      }
    } catch (error: any) {
      console.error('[EventModal] Delete failed:', error);
      console.error('[EventModal] Error details:', {
        message: error?.message,
        response: error?.response,
        stack: error?.stack
      });
      showToast({
        message: error?.response?.data?.error || 'Failed to delete event',
        status: 'error',
      });
    } finally {
      setIsDeleting(false);
    }
  }, [event._id, event.is_occurrence, event.parent_event_id, event.start_datetime, event.is_recurring, deleteEventMutation, showToast, onClose, onDeleted]);

  const getMeetingProviderLabel = (provider?: string) => {
    switch (provider) {
      case 'zoom':
        return 'Zoom Meeting';
      case 'google_meet':
        return 'Google Meet';
      case 'custom':
        return 'Meeting Link';
      default:
        return 'No meeting link';
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-lg p-6">
          <DialogHeader className="mb-4">
            <DialogTitle>
              <span className="text-xl font-semibold">{event.title}</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Event Type Badge */}
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium',
                  style.bgColor,
                  style.textColor,
                  'border',
                  style.borderColor
                )}
              >
                <Icon className="w-4 h-4" />
                {style.label}
              </div>
              {event.is_recurring && (
                <div className="inline-flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                  <Repeat className="w-4 h-4" />
                  Recurring Event
                </div>
              )}
            </div>

            {/* Date and Time */}
            <div className="space-y-2">
              <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                <Calendar className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                <span className="font-medium">
                  {format(startDate, 'EEEE, MMMM d, yyyy')}
                </span>
              </div>
              <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                <Clock className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                <span>
                  {format(startDate, 'h:mm a')} - {format(endDate, 'h:mm a')}
                  {event.timezone && (
                    <span className="text-gray-500 dark:text-gray-400 ml-1">
                      ({event.timezone})
                    </span>
                  )}
                </span>
              </div>
            </div>

            {/* Description */}
            {event.description && (
              <div className="pt-2">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  About this event
                </h3>
                <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                  {event.description}
                </p>
              </div>
            )}

            {/* Meeting Link */}
            {event.meeting_link && (
              <div className="pt-2">
                <div className="flex items-center gap-3 mb-3">
                  <Video className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                  <span className="text-gray-700 dark:text-gray-300">
                    {getMeetingProviderLabel(event.meeting_provider)}
                  </span>
                </div>
                <button
                  onClick={handleJoinMeeting}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  <LinkIcon className="w-4 h-4" />
                  Join Meeting
                </button>
              </div>
            )}

            {/* No Meeting Link Notice */}
            {!event.meeting_link && (
              <div className="pt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm">
                    Meeting details will be shared closer to the event date
                  </span>
                </div>
              </div>
            )}

            {/* Admin Actions */}
            {isAdmin && (
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700 flex gap-2">
                <button
                  onClick={onEdit}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  Edit Event
                </button>
                <button
                  onClick={async () => {
                    console.log('[EventModal] Delete button clicked');
                    
                    let shouldDeleteSeries = false;
                    
                    if (event.is_occurrence || event.parent_event_id) {
                      // For recurring events, ask whether to delete all or just this one
                      const deleteAll = window.confirm(
                        `This is a recurring event.\n\nClick OK to delete ALL events in this series,\nor Cancel to delete only this occurrence.`
                      );
                      
                      if (deleteAll) {
                        // Confirm deletion of entire series
                        const confirmSeries = window.confirm(
                          `Are you sure you want to delete ALL events in the series "${event.title}"?\n\nThis will delete all occurrences and cannot be undone.`
                        );
                        if (!confirmSeries) return;
                        shouldDeleteSeries = true;
                      } else {
                        // Confirm deletion of single occurrence
                        const confirmSingle = window.confirm(
                          `Are you sure you want to delete only this occurrence of "${event.title}"?\n\nOther events in the series will remain.`
                        );
                        if (!confirmSingle) return;
                        shouldDeleteSeries = false;
                      }
                    } else {
                      // For non-recurring events, simple confirmation
                      const confirmed = window.confirm(
                        `Are you sure you want to delete "${event.title}"?\n\nThis action cannot be undone.`
                      );
                      if (!confirmed) return;
                    }
                    
                    console.log('[EventModal] User confirmed deletion, deleteSeries:', shouldDeleteSeries);
                    await handleDelete(shouldDeleteSeries);
                  }}
                  disabled={isDeleting}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Trash2 className="w-4 h-4" />
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default EventModal;