const mongoose = require('mongoose');

const calendarEventSchema = new mongoose.Schema({
  // Basic event information
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  event_type: {
    type: String,
    enum: ['office_hours', 'community_call', 'workshop', 'coaching'],
    required: true
  },

  // Timing
  start_datetime: {
    type: Date,
    required: true
  },
  duration_minutes: {
    type: Number,
    required: true,
    default: 60
  },
  timezone: {
    type: String,
    default: 'America/Los_Angeles'
  },

  // Meeting details
  meeting_link: {
    type: String,
    default: ''
  },
  meeting_provider: {
    type: String,
    enum: ['zoom', 'google_meet', 'custom', 'none'],
    default: 'zoom'
  },

  // Recurrence
  is_recurring: {
    type: Boolean,
    default: false
  },
  recurrence_pattern: {
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'biweekly', 'monthly'],
      default: 'weekly'
    },
    interval: {
      type: Number,
      default: 1
    },
    days_of_week: [{
      type: Number, // 0-6 (Sunday-Saturday)
      min: 0,
      max: 6
    }],
    end_type: {
      type: String,
      enum: ['never', 'after_occurrences', 'by_date'],
      default: 'never'
    },
    occurrences: {
      type: Number,
      default: 8
    },
    end_date: Date
  },
  // For recurring events: dates (YYYY-MM-DD) of cancelled single occurrences
  cancelled_dates: {
    type: [String],
    default: [],
  },
  parent_event_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CalendarEvent',
    default: null
  },
  is_occurrence: {
    type: Boolean,
    default: false
  },

  // Metadata
  created_by_admin_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  is_active: {
    type: Boolean,
    default: true
  },
  deleted_at: {
    type: Date,
    default: null
  }
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
});

// Indexes for performance
calendarEventSchema.index({ start_datetime: 1, is_active: 1 });
calendarEventSchema.index({ parent_event_id: 1 });
calendarEventSchema.index({ event_type: 1 });
calendarEventSchema.index({ deleted_at: 1 });

// Virtual for end time
calendarEventSchema.virtual('end_datetime').get(function() {
  if (!this.start_datetime || !this.duration_minutes) return null;
  const endTime = new Date(this.start_datetime);
  endTime.setMinutes(endTime.getMinutes() + this.duration_minutes);
  return endTime;
});

// Method to check if event is happening now
calendarEventSchema.methods.isHappeningNow = function() {
  const now = new Date();
  const start = new Date(this.start_datetime);
  const end = new Date(this.end_datetime);
  return now >= start && now <= end;
};

// Method to check if event is in the future
calendarEventSchema.methods.isFuture = function() {
  const now = new Date();
  const start = new Date(this.start_datetime);
  return start > now;
};

// Method to check if event is in the past
calendarEventSchema.methods.isPast = function() {
  const now = new Date();
  const end = new Date(this.end_datetime);
  return end < now;
};

// Static method to get events for a date range
calendarEventSchema.statics.getEventsInRange = async function(startDate, endDate, includeRecurring = true) {
  const query = {
    is_active: true,
    deleted_at: null,
    start_datetime: {
      $gte: startDate,
      $lte: endDate
    }
  };

  if (!includeRecurring) {
    query.is_occurrence = false;
  }

  return this.find(query).sort({ start_datetime: 1 });
};

// Static method to get upcoming events
calendarEventSchema.statics.getUpcomingEvents = async function(limit = 10) {
  const now = new Date();
  return this.find({
    is_active: true,
    deleted_at: null,
    start_datetime: { $gte: now }
  })
  .sort({ start_datetime: 1 })
  .limit(limit);
};

// Event templates
calendarEventSchema.statics.EVENT_TEMPLATES = {
  office_hours: {
    title: 'Office Hours with James',
    description: 'Weekly office hours for Q&A and coaching',
    event_type: 'office_hours',
    duration_minutes: 60,
    meeting_provider: 'zoom',
    is_recurring: true,
    recurrence_pattern: {
      frequency: 'weekly',
      interval: 1,
      days_of_week: [4], // Thursday
      end_type: 'never'
    }
  },
  community_call: {
    title: 'Community Call',
    description: 'Weekly community gathering and discussion',
    event_type: 'community_call',
    duration_minutes: 60,
    meeting_provider: 'zoom',
    is_recurring: true,
    recurrence_pattern: {
      frequency: 'weekly',
      interval: 1,
      days_of_week: [6], // Saturday
      end_type: 'never'
    }
  },
  workshop: {
    title: 'Workshop',
    description: 'Interactive workshop session',
    event_type: 'workshop',
    duration_minutes: 90,
    meeting_provider: 'zoom',
    is_recurring: true,
    recurrence_pattern: {
      frequency: 'weekly',
      interval: 1,
      days_of_week: [1], // Monday
      end_type: 'after_occurrences',
      occurrences: 8
    }
  },
  coaching: {
    title: 'Dark JK Group Coaching',
    description: 'Group coaching session',
    event_type: 'coaching',
    duration_minutes: 45,
    meeting_provider: 'zoom',
    is_recurring: false
  }
};

// Ensure virtuals are included when converting to JSON
calendarEventSchema.set('toJSON', {
  virtuals: true
});

module.exports = mongoose.model('CalendarEvent', calendarEventSchema);