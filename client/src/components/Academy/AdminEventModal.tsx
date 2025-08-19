import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { X, Save, Trash2, Copy, Calendar } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '~/components/ui';
import { 
  useCreateCalendarEvent, 
  useUpdateCalendarEvent, 
  useDeleteCalendarEvent,
  useGetEventTemplates 
} from '~/data-provider/Academy';
import { cn } from '~/utils';
import { useToastContext } from '~/Providers';

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
  recurrence_pattern?: {
    frequency: string;
    interval: number;
    days_of_week?: number[];
    end_type: string;
    occurrences?: number;
    end_date?: string;
  };
}

interface AdminEventModalProps {
  event?: CalendarEvent | null;
  defaultDate?: Date | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

const AdminEventModal: React.FC<AdminEventModalProps> = ({ 
  event, 
  defaultDate, 
  isOpen, 
  onClose, 
  onSave 
}) => {
  console.log('[AdminEventModal] Component mounted/rendered with event:', event);
  console.log('[AdminEventModal] Event ID on mount:', event?._id);
  const { showToast } = useToastContext();
  const createEvent = useCreateCalendarEvent();
  const updateEvent = useUpdateCalendarEvent();
  const deleteEvent = useDeleteCalendarEvent();
  const { data: templatesData } = useGetEventTemplates();

  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_type: 'office_hours' as const,
    start_datetime: '',
    duration_minutes: 60,
    meeting_link: '',
    meeting_provider: 'zoom' as const,
    is_recurring: false,
    recurrence_pattern: {
      frequency: 'weekly',
      interval: 1,
      days_of_week: [] as number[],
      end_type: 'never',
      occurrences: 8,
      end_date: '',
    },
  });

  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [updateSeries, setUpdateSeries] = useState(false);
  const [deleteSeries, setDeleteSeries] = useState(false);

  useEffect(() => {
    if (event) {
      // Editing existing event
      // Convert UTC time to local time for the datetime-local input
      const eventDate = new Date(event.start_datetime);
      const year = eventDate.getFullYear();
      const month = String(eventDate.getMonth() + 1).padStart(2, '0');
      const day = String(eventDate.getDate()).padStart(2, '0');
      const hours = String(eventDate.getHours()).padStart(2, '0');
      const minutes = String(eventDate.getMinutes()).padStart(2, '0');
      const localDateTimeStr = `${year}-${month}-${day}T${hours}:${minutes}`;
      
      setFormData({
        title: event.title,
        description: event.description || '',
        event_type: event.event_type,
        start_datetime: localDateTimeStr, // Use local time for datetime-local input
        duration_minutes: event.duration_minutes,
        meeting_link: event.meeting_link || '',
        meeting_provider: event.meeting_provider || 'zoom',
        is_recurring: event.is_recurring || false,
        recurrence_pattern: event.recurrence_pattern || {
          frequency: 'weekly',
          interval: 1,
          days_of_week: [],
          end_type: 'never',
          occurrences: 8,
          end_date: '',
        },
      });
    } else if (defaultDate) {
      // Creating new event with default date
      const dateStr = format(defaultDate, "yyyy-MM-dd'T'HH:mm");
      setFormData(prev => ({
        ...prev,
        start_datetime: dateStr,
      }));
    }
  }, [event, defaultDate]);

  const handleTemplateSelect = (templateKey: string) => {
    if (!templatesData?.templates) return;
    
    const template = templatesData.templates[templateKey];
    if (template) {
      setFormData(prev => ({
        ...prev,
        ...template,
        start_datetime: prev.start_datetime, // Keep the selected date/time
      }));
      setSelectedTemplate(templateKey);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Convert local datetime to ISO string (includes timezone offset)
      const localDate = new Date(formData.start_datetime);
      const dataToSubmit = {
        ...formData,
        start_datetime: localDate.toISOString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, // Get user's timezone
      };

      if (event) {
        // Update existing event
        await updateEvent.mutateAsync({
          id: event._id,
          data: dataToSubmit,
          updateSeries,
        });
        showToast({
          message: `Event ${updateSeries ? 'series' : ''} updated successfully`,
          status: 'success',
        });
      } else {
        // Create new event
        if (selectedTemplate) {
          // Create from template
          await createEvent.mutateAsync({
            template: selectedTemplate,
            ...dataToSubmit,
          });
        } else {
          // Create regular event
          await createEvent.mutateAsync(dataToSubmit);
        }
        showToast({
          message: 'Event created successfully',
          status: 'success',
        });
      }
      onSave();
    } catch (error) {
      showToast({
        message: 'Failed to save event',
        status: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    console.log('[AdminEventModal] handleDelete called, event:', event);
    
    // Determine the correct ID to use for deletion
    // For recurring occurrences, use parent_event_id; for regular events, use _id
    const deleteId = event?.is_occurrence ? event.parent_event_id : event?._id;
    const occurrenceDate = event?.is_occurrence
      ? new Date(event.start_datetime).toISOString().slice(0, 10)
      : undefined;
    
    console.log('[AdminEventModal] Delete ID:', deleteId, {
      isOccurrence: event?.is_occurrence,
      parentEventId: event?.parent_event_id,
      eventId: event?._id
    });
    
    if (!event || !deleteId) {
      console.error('[AdminEventModal] Event or delete ID is missing!', { event, deleteId });
      showToast({
        message: 'Unable to delete: Event ID is missing',
        status: 'error',
      });
      return;
    }
    
    if (!confirm(`Are you sure you want to delete this event${deleteSeries ? ' series' : ''}?`)) {
      return;
    }

    setIsLoading(true);
    try {
      await deleteEvent.mutateAsync({
        id: deleteId,
        deleteSeries,
        occurrenceDate,
      });
      showToast({
        message: `Event ${deleteSeries ? 'series' : ''} deleted successfully`,
        status: 'success',
      });
      onSave();
    } catch (error) {
      showToast({
        message: 'Failed to delete event',
        status: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (name.startsWith('recurrence_')) {
      const field = name.replace('recurrence_', '');
      setFormData(prev => ({
        ...prev,
        recurrence_pattern: {
          ...prev.recurrence_pattern,
          [field]: type === 'number' ? parseInt(value) : value,
        },
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : 
                type === 'number' ? parseInt(value) : value,
      }));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader className="mb-4">
          <DialogTitle>
            <span className="text-xl font-semibold">
              {event ? 'Edit Event' : 'Create New Event'}
            </span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Template Selection (for new events) */}
          {!event && templatesData?.templates && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Use Template (Optional)
              </label>
              <select
                value={selectedTemplate}
                onChange={(e) => handleTemplateSelect(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              >
                <option value="">-- No Template --</option>
                {Object.keys(templatesData.templates).map((key) => (
                  <option key={key} value={key}>
                    {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Event Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
          </div>

          {/* Event Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Event Type *
            </label>
            <select
              name="event_type"
              value={formData.event_type}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            >
              <option value="office_hours">Office Hours</option>
              <option value="community_call">Community Call</option>
              <option value="workshop">Workshop</option>
              <option value="coaching">Group Coaching</option>
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Start Date & Time *
                <span className="text-xs font-normal text-gray-500 dark:text-gray-400 ml-1">
                  ({Intl.DateTimeFormat().resolvedOptions().timeZone})
                </span>
              </label>
              <input
                type="datetime-local"
                name="start_datetime"
                value={formData.start_datetime}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Duration (minutes) *
              </label>
              <input
                type="number"
                name="duration_minutes"
                value={formData.duration_minutes}
                onChange={handleInputChange}
                min="15"
                max="480"
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>

          {/* Meeting Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Meeting Provider
              </label>
              <select
                name="meeting_provider"
                value={formData.meeting_provider}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              >
                <option value="zoom">Zoom</option>
                <option value="google_meet">Google Meet</option>
                <option value="custom">Custom Link</option>
                <option value="none">No Meeting</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Meeting Link
              </label>
              <input
                type="url"
                name="meeting_link"
                value={formData.meeting_link}
                onChange={handleInputChange}
                placeholder="https://zoom.us/j/..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>

          {/* Recurring Event */}
          <div className="border-t pt-4">
            <div className="flex items-center gap-2 mb-4">
              <input
                type="checkbox"
                id="is_recurring"
                name="is_recurring"
                checked={formData.is_recurring}
                onChange={handleInputChange}
                className="rounded border-gray-300 dark:border-gray-600"
              />
              <label htmlFor="is_recurring" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                This is a recurring event
              </label>
            </div>

            {formData.is_recurring && (
              <div className="space-y-4 pl-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Frequency
                    </label>
                    <select
                      name="recurrence_frequency"
                      value={formData.recurrence_pattern.frequency}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="biweekly">Bi-weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      End Type
                    </label>
                    <select
                      name="recurrence_end_type"
                      value={formData.recurrence_pattern.end_type}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    >
                      <option value="never">Never</option>
                      <option value="after_occurrences">After X occurrences</option>
                      <option value="by_date">By specific date</option>
                    </select>
                  </div>
                </div>

                {formData.recurrence_pattern.end_type === 'after_occurrences' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Number of Occurrences
                    </label>
                    <input
                      type="number"
                      name="recurrence_occurrences"
                      value={formData.recurrence_pattern.occurrences}
                      onChange={handleInputChange}
                      min="1"
                      max="365"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                )}

                {formData.recurrence_pattern.end_type === 'by_date' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      End Date
                    </label>
                    <input
                      type="date"
                      name="recurrence_end_date"
                      value={formData.recurrence_pattern.end_date}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Update/Delete Options for existing events */}
          {event && event.is_recurring && (
            <div className="border-t pt-4 space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="updateSeries"
                  checked={updateSeries}
                  onChange={(e) => setUpdateSeries(e.target.checked)}
                  className="rounded border-gray-300 dark:border-gray-600"
                />
                <label htmlFor="updateSeries" className="text-sm text-gray-600 dark:text-gray-400">
                  Update entire series
                </label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="deleteSeries"
                  checked={deleteSeries}
                  onChange={(e) => setDeleteSeries(e.target.checked)}
                  className="rounded border-gray-300 dark:border-gray-600"
                />
                <label htmlFor="deleteSeries" className="text-sm text-gray-600 dark:text-gray-400">
                  Delete entire series
                </label>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between pt-4 border-t">
            <div>
              {event && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isLoading}
                  className="flex items-center gap-2 px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Event
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {isLoading ? 'Saving...' : 'Save Event'}
              </button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AdminEventModal;