const express = require('express');
const router = express.Router();
const CalendarController = require('~/server/controllers/lms/CalendarController');
const requireJwtAuth = require('~/server/middleware/requireJwtAuth');
const checkAdmin = require('~/server/middleware/roles/admin');

/**
 * Public Routes (authenticated users)
 * All Academy users can view calendar events
 */

// Get events for a specific month
// GET /api/academy/calendar/events?year=2025&month=8
router.get('/events', requireJwtAuth, CalendarController.getMonthEvents);

// Get upcoming events
// GET /api/academy/calendar/events/upcoming?limit=10
router.get('/events/upcoming', requireJwtAuth, CalendarController.getUpcomingEvents);

// Get events in a date range
// GET /api/academy/calendar/events/range?start=2025-08-01&end=2025-08-31
router.get('/events/range', requireJwtAuth, CalendarController.getEventsInRange);

// Get single event details
// GET /api/academy/calendar/events/:id
router.get('/events/:id', requireJwtAuth, CalendarController.getEventById);

/**
 * Admin Only Routes
 * Only admins can create, update, and delete events
 */

// Get all events for admin management
// GET /api/academy/calendar/admin/events
router.get('/admin/events', requireJwtAuth, checkAdmin, CalendarController.getAllEvents);

// Get event templates
// GET /api/academy/calendar/admin/templates
router.get('/admin/templates', requireJwtAuth, checkAdmin, CalendarController.getEventTemplates);

// Create new event
// POST /api/academy/calendar/admin/events
router.post('/admin/events', requireJwtAuth, checkAdmin, CalendarController.createEvent);

// Create event from template
// POST /api/academy/calendar/admin/events/from-template
router.post('/admin/events/from-template', requireJwtAuth, checkAdmin, CalendarController.createFromTemplate);

// Update event
// PUT /api/academy/calendar/admin/events/:id?updateSeries=true
router.put('/admin/events/:id', requireJwtAuth, checkAdmin, CalendarController.updateEvent);

// Delete event (soft delete)
// DELETE /api/academy/calendar/admin/events/:id?deleteSeries=true
router.delete('/admin/events/:id', requireJwtAuth, checkAdmin, CalendarController.deleteEvent);

module.exports = router;