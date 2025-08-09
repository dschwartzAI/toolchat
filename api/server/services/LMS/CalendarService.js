const CalendarEvent = require('~/models/CalendarEvent');

class CalendarService {
  /**
   * Generate recurring event occurrences
   * @param {Object} parentEvent - The parent recurring event
   * @param {Date} startFrom - Start generating from this date
   * @param {Date} endBefore - Stop generating before this date
   * @returns {Array} Array of event occurrences
   */
  static async generateRecurringOccurrences(parentEvent, startFrom, endBefore) {
    const occurrences = [];
    const { recurrence_pattern } = parentEvent;
    
    if (!parentEvent.is_recurring || !recurrence_pattern) {
      return occurrences;
    }

    let currentDate = new Date(parentEvent.start_datetime);
    let occurrenceCount = 0;
    const maxOccurrences = recurrence_pattern.occurrences || 52; // Default to 52 occurrences (1 year weekly)

    // Set the end boundary based on recurrence pattern
    let endBoundary = new Date(endBefore);
    if (recurrence_pattern.end_type === 'by_date' && recurrence_pattern.end_date) {
      endBoundary = new Date(Math.min(new Date(recurrence_pattern.end_date), endBoundary));
    }

    while (currentDate <= endBoundary) {
      // Check if we've reached the occurrence limit
      if (recurrence_pattern.end_type === 'after_occurrences' && occurrenceCount >= maxOccurrences) {
        break;
      }

      // Check if current date is after startFrom
      if (currentDate >= startFrom) {
        // Create occurrence event with a unique ID based on parent ID and date
        // This ensures each occurrence has a unique identifier for frontend operations
        const occurrenceId = `${parentEvent._id}_${currentDate.toISOString().split('T')[0]}`;
        // Skip if this occurrence date was cancelled on the parent event
        const ymd = currentDate.toISOString().split('T')[0];
        if (Array.isArray(parentEvent.cancelled_dates) && parentEvent.cancelled_dates.includes(ymd)) {
          currentDate = this.getNextOccurrenceDate(currentDate, recurrence_pattern);
          continue;
        }
        const occurrence = {
          ...parentEvent.toObject(),
          _id: occurrenceId,
          start_datetime: new Date(currentDate),
          parent_event_id: parentEvent._id,
          is_occurrence: true,
          is_recurring: false,
          recurrence_pattern: undefined
        };
        
        occurrences.push(occurrence);
        occurrenceCount++;
      }

      // Move to next occurrence based on frequency
      currentDate = this.getNextOccurrenceDate(currentDate, recurrence_pattern);
      
      // Safety check to prevent infinite loops
      if (occurrences.length > 365) {
        console.warn('Too many occurrences generated, stopping at 365');
        break;
      }
    }

    return occurrences;
  }

  /**
   * Calculate the next occurrence date based on recurrence pattern
   * @param {Date} currentDate - Current date
   * @param {Object} pattern - Recurrence pattern
   * @returns {Date} Next occurrence date
   */
  static getNextOccurrenceDate(currentDate, pattern) {
    const nextDate = new Date(currentDate);
    const { frequency, interval = 1 } = pattern;

    switch (frequency) {
      case 'daily':
        nextDate.setDate(nextDate.getDate() + interval);
        break;
      
      case 'weekly':
        nextDate.setDate(nextDate.getDate() + (7 * interval));
        break;
      
      case 'biweekly':
        nextDate.setDate(nextDate.getDate() + 14);
        break;
      
      case 'monthly':
        nextDate.setMonth(nextDate.getMonth() + interval);
        break;
      
      default:
        nextDate.setDate(nextDate.getDate() + 7); // Default to weekly
    }

    return nextDate;
  }

  /**
   * Get all events for a specific month
   * @param {Number} year - Year
   * @param {Number} month - Month (0-11)
   * @returns {Array} Events for the month
   */
  static async getMonthEvents(year, month) {
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0, 23, 59, 59);

    // Get regular events in the date range
    const regularEvents = await CalendarEvent.find({
      is_active: true,
      deleted_at: null,
      is_recurring: false,
      start_datetime: {
        $gte: startDate,
        $lte: endDate
      }
    }).sort({ start_datetime: 1 });

    // Get recurring parent events
    const recurringEvents = await CalendarEvent.find({
      is_active: true,
      deleted_at: null,
      is_recurring: true,
      start_datetime: { $lte: endDate }
    });

    // Generate occurrences for recurring events
    const allOccurrences = [];
    for (const recurringEvent of recurringEvents) {
      const occurrences = await this.generateRecurringOccurrences(
        recurringEvent,
        startDate,
        endDate
      );
      allOccurrences.push(...occurrences);
    }

    // Combine and sort all events
    const allEvents = [...regularEvents, ...allOccurrences];
    allEvents.sort((a, b) => new Date(a.start_datetime) - new Date(b.start_datetime));

    return allEvents;
  }

  /**
   * Create a new event with optional recurrence
   * @param {Object} eventData - Event data
   * @param {String} adminId - Admin user ID
   * @returns {Object} Created event
   */
  static async createEvent(eventData, adminId) {
    const event = new CalendarEvent({
      ...eventData,
      created_by_admin_id: adminId
    });

    // If using a template, apply template defaults
    if (eventData.template) {
      const template = CalendarEvent.EVENT_TEMPLATES[eventData.template];
      if (template) {
        Object.assign(event, template, eventData); // eventData overrides template
      }
    }

    // Generate default meeting link if needed
    if (event.meeting_provider === 'zoom' && !event.meeting_link) {
      event.meeting_link = await this.generateMeetingLink(event);
    }

    await event.save();
    return event;
  }

  /**
   * Update an event
   * @param {String} eventId - Event ID
   * @param {Object} updates - Updates to apply
   * @param {Boolean} updateSeries - Update entire series for recurring events
   * @returns {Object} Updated event(s)
   */
  static async updateEvent(eventId, updates, updateSeries = false) {
    const event = await CalendarEvent.findById(eventId);
    
    if (!event) {
      throw new Error('Event not found');
    }

    // If updating a recurring series
    if (updateSeries && event.is_recurring) {
      // Update the parent event
      Object.assign(event, updates);
      await event.save();

      // Delete existing occurrences (they'll be regenerated on next fetch)
      await CalendarEvent.deleteMany({
        parent_event_id: event._id
      });

      return { updated: 'series', event };
    }

    // Update single event
    Object.assign(event, updates);
    await event.save();
    
    return { updated: 'single', event };
  }

  /**
   * Delete an event
   * @param {String} eventId - Event ID
   * @param {Boolean} deleteSeries - Delete entire series for recurring events
   * @returns {Object} Deletion result
   */
  static async deleteEvent(eventId, deleteSeries = false) {
    const event = await CalendarEvent.findById(eventId);
    
    if (!event) {
      throw new Error('Event not found');
    }

    // Soft delete by setting deleted_at
    event.deleted_at = new Date();
    event.is_active = false;

    if (deleteSeries && event.is_recurring) {
      // Soft delete all occurrences
      await CalendarEvent.updateMany(
        { parent_event_id: event._id },
        { 
          deleted_at: new Date(),
          is_active: false
        }
      );
      
      await event.save();
      return { deleted: 'series', count: 1 };
    }

    await event.save();
    return { deleted: 'single', count: 1 };
  }

  /**
   * Delete a single occurrence of a recurring event by marking its date as cancelled
   * @param {String} parentEventId - ID of the recurring parent event
   * @param {String} occurrenceDate - ISO date (YYYY-MM-DD) of the occurrence to cancel
   */
  static async deleteOccurrence(parentEventId, occurrenceDate) {
    const parent = await CalendarEvent.findById(parentEventId);
    if (!parent || !parent.is_recurring) {
      throw new Error('Parent recurring event not found');
    }
    const ymd = (occurrenceDate || '').slice(0, 10);
    if (!ymd) {
      throw new Error('Invalid occurrence date');
    }
    const set = new Set(parent.cancelled_dates || []);
    set.add(ymd);
    parent.cancelled_dates = Array.from(set);
    await parent.save();
    return { deleted: 'occurrence', count: 1 };
  }

  /**
   * Get upcoming events
   * @param {Number} limit - Number of events to return
   * @returns {Array} Upcoming events
   */
  static async getUpcomingEvents(limit = 10) {
    const now = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 3); // Look 3 months ahead

    // Get regular upcoming events
    const regularEvents = await CalendarEvent.find({
      is_active: true,
      deleted_at: null,
      is_recurring: false,
      start_datetime: {
        $gte: now,
        $lte: endDate
      }
    })
    .sort({ start_datetime: 1 })
    .limit(limit);

    // Get recurring events and generate occurrences
    const recurringEvents = await CalendarEvent.find({
      is_active: true,
      deleted_at: null,
      is_recurring: true,
      start_datetime: { $lte: endDate }
    });

    const allOccurrences = [];
    for (const recurringEvent of recurringEvents) {
      const occurrences = await this.generateRecurringOccurrences(
        recurringEvent,
        now,
        endDate
      );
      allOccurrences.push(...occurrences);
    }

    // Combine, sort, and limit
    const allEvents = [...regularEvents, ...allOccurrences];
    allEvents.sort((a, b) => new Date(a.start_datetime) - new Date(b.start_datetime));
    
    return allEvents.slice(0, limit);
  }

  /**
   * Generate a meeting link (placeholder - would integrate with Zoom API)
   * @param {Object} event - Event object
   * @returns {String} Meeting link
   */
  static async generateMeetingLink(event) {
    // In production, this would integrate with Zoom API
    // For now, return a placeholder
    const meetingId = Math.random().toString(36).substring(2, 15);
    return `https://zoom.us/j/${meetingId}`;
  }

  /**
   * Get event by ID with populated admin info
   * @param {String} eventId - Event ID
   * @returns {Object} Event with admin info
   */
  static async getEventById(eventId) {
    return CalendarEvent.findById(eventId)
      .populate('created_by_admin_id', 'name email')
      .populate('parent_event_id');
  }

  /**
   * Get all events (admin view)
   * @returns {Array} All active events
   */
  static async getAllEvents() {
    return CalendarEvent.find({
      is_active: true,
      deleted_at: null,
      is_occurrence: false // Don't show generated occurrences in admin view
    })
    .populate('created_by_admin_id', 'name email')
    .sort({ start_datetime: -1 });
  }
}

module.exports = CalendarService;