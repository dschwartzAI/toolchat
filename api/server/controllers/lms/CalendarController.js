const CalendarService = require('~/server/services/LMS/CalendarService');
const CalendarEvent = require('~/models/CalendarEvent');
const { logger } = require('~/config');

/**
 * Calendar Controller
 * Handles all calendar-related HTTP requests
 */
class CalendarController {
  /**
   * Get events for a specific month
   * GET /api/academy/calendar/events
   * Query params: year, month
   */
  static async getMonthEvents(req, res) {
    try {
      const { year, month } = req.query;
      
      if (!year || month === undefined) {
        const now = new Date();
        const events = await CalendarService.getMonthEvents(
          now.getFullYear(),
          now.getMonth()
        );
        return res.json({ events });
      }

      const events = await CalendarService.getMonthEvents(
        parseInt(year),
        parseInt(month)
      );
      
      res.json({ events });
    } catch (error) {
      logger.error('[CalendarController] Error getting month events:', error);
      res.status(500).json({ error: 'Failed to fetch calendar events' });
    }
  }

  /**
   * Get upcoming events
   * GET /api/academy/calendar/events/upcoming
   * Query params: limit (optional)
   */
  static async getUpcomingEvents(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 10;
      const events = await CalendarService.getUpcomingEvents(limit);
      
      res.json({ events });
    } catch (error) {
      logger.error('[CalendarController] Error getting upcoming events:', error);
      res.status(500).json({ error: 'Failed to fetch upcoming events' });
    }
  }

  /**
   * Get single event details
   * GET /api/academy/calendar/events/:id
   */
  static async getEventById(req, res) {
    try {
      const { id } = req.params;
      const event = await CalendarService.getEventById(id);
      
      if (!event) {
        return res.status(404).json({ error: 'Event not found' });
      }
      
      res.json({ event });
    } catch (error) {
      logger.error('[CalendarController] Error getting event:', error);
      res.status(500).json({ error: 'Failed to fetch event details' });
    }
  }

  /**
   * Create new event (Admin only)
   * POST /api/academy/calendar/admin/events
   */
  static async createEvent(req, res) {
    try {
      const adminId = req.user.id;
      const eventData = req.body;
      
      // Validate required fields
      if (!eventData.title || !eventData.event_type || !eventData.start_datetime) {
        return res.status(400).json({ 
          error: 'Missing required fields: title, event_type, start_datetime' 
        });
      }

      const event = await CalendarService.createEvent(eventData, adminId);
      
      res.status(201).json({ 
        message: 'Event created successfully',
        event 
      });
    } catch (error) {
      logger.error('[CalendarController] Error creating event:', error);
      res.status(500).json({ error: 'Failed to create event' });
    }
  }

  /**
   * Update event (Admin only)
   * PUT /api/academy/calendar/admin/events/:id
   */
  static async updateEvent(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;
      const { updateSeries } = req.query;
      
      const result = await CalendarService.updateEvent(
        id, 
        updates, 
        updateSeries === 'true'
      );
      
      res.json({ 
        message: `Event ${result.updated === 'series' ? 'series' : ''} updated successfully`,
        event: result.event,
        updated: result.updated
      });
    } catch (error) {
      logger.error('[CalendarController] Error updating event:', error);
      res.status(500).json({ error: 'Failed to update event' });
    }
  }

  /**
   * Delete event (Admin only)
   * DELETE /api/academy/calendar/admin/events/:id
   */
  static async deleteEvent(req, res) {
    try {
      const { id } = req.params;
      const { deleteSeries, occurrenceDate } = req.query;
      
      let result;
      // If an occurrenceDate is provided, cancel a single occurrence on a recurring parent
      if (occurrenceDate) {
        result = await CalendarService.deleteOccurrence(id, occurrenceDate);
      } else {
        result = await CalendarService.deleteEvent(
          id,
          deleteSeries === 'true'
        );
      }
      
      res.json({ 
        message: `Event ${result.deleted === 'series' ? 'series' : result.deleted === 'occurrence' ? 'occurrence' : ''} deleted successfully`,
        deleted: result.deleted,
        count: result.count
      });
    } catch (error) {
      logger.error('[CalendarController] Error deleting event:', error);
      res.status(500).json({ error: 'Failed to delete event' });
    }
  }

  /**
   * Get all events for admin management
   * GET /api/academy/calendar/admin/events
   */
  static async getAllEvents(req, res) {
    try {
      const events = await CalendarService.getAllEvents();
      
      res.json({ events });
    } catch (error) {
      logger.error('[CalendarController] Error getting all events:', error);
      res.status(500).json({ error: 'Failed to fetch all events' });
    }
  }

  /**
   * Get event templates
   * GET /api/academy/calendar/admin/templates
   */
  static async getEventTemplates(req, res) {
    try {
      const templates = CalendarEvent.EVENT_TEMPLATES;
      
      res.json({ templates });
    } catch (error) {
      logger.error('[CalendarController] Error getting templates:', error);
      res.status(500).json({ error: 'Failed to fetch event templates' });
    }
  }

  /**
   * Create event from template (Admin only)
   * POST /api/academy/calendar/admin/events/from-template
   */
  static async createFromTemplate(req, res) {
    try {
      const adminId = req.user.id;
      const { template, ...overrides } = req.body;
      
      if (!template) {
        return res.status(400).json({ error: 'Template name is required' });
      }

      const templateData = CalendarEvent.EVENT_TEMPLATES[template];
      if (!templateData) {
        return res.status(400).json({ error: 'Invalid template name' });
      }

      // Merge template with overrides
      const eventData = {
        ...templateData,
        ...overrides,
        template // Keep track of which template was used
      };

      const event = await CalendarService.createEvent(eventData, adminId);
      
      res.status(201).json({ 
        message: 'Event created from template successfully',
        event 
      });
    } catch (error) {
      logger.error('[CalendarController] Error creating from template:', error);
      res.status(500).json({ error: 'Failed to create event from template' });
    }
  }

  /**
   * Get events for a date range
   * GET /api/academy/calendar/events/range
   * Query params: start, end
   */
  static async getEventsInRange(req, res) {
    try {
      const { start, end } = req.query;
      
      if (!start || !end) {
        return res.status(400).json({ 
          error: 'Start and end dates are required' 
        });
      }

      const startDate = new Date(start);
      const endDate = new Date(end);
      
      if (isNaN(startDate) || isNaN(endDate)) {
        return res.status(400).json({ 
          error: 'Invalid date format' 
        });
      }

      const events = await CalendarEvent.getEventsInRange(startDate, endDate);
      
      res.json({ events });
    } catch (error) {
      logger.error('[CalendarController] Error getting events in range:', error);
      res.status(500).json({ error: 'Failed to fetch events in range' });
    }
  }
}

module.exports = CalendarController;