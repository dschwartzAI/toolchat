import { Schema } from 'mongoose';
import type { Document } from 'mongoose';

export interface IProgress extends Document {
  user: Schema.Types.ObjectId;
  course: Schema.Types.ObjectId;
  lesson: Schema.Types.ObjectId;
  module: Schema.Types.ObjectId;
  watchTime: number; // Seconds watched
  completed: boolean;
  lastPosition: number; // Last video position in seconds
  completedAt?: Date;
  lastAccessedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const progressSchema = new Schema<IProgress>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    course: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true,
    },
    lesson: {
      type: Schema.Types.ObjectId,
      ref: 'Lesson',
      required: true,
      index: true,
    },
    module: {
      type: Schema.Types.ObjectId,
      ref: 'Module',
      required: true,
      index: true,
    },
    watchTime: {
      type: Number,
      default: 0,
      min: 0,
    },
    completed: {
      type: Boolean,
      default: false,
      index: true,
    },
    lastPosition: {
      type: Number,
      default: 0,
      min: 0,
    },
    completedAt: {
      type: Date,
    },
    lastAccessedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Unique compound index to ensure one progress record per user-lesson combination
progressSchema.index({ user: 1, course: 1, lesson: 1 }, { unique: true });

// Index for efficiently querying user's course progress
progressSchema.index({ user: 1, course: 1, completed: 1 });

// Index for getting all progress for a specific module
progressSchema.index({ user: 1, module: 1 });

// Update lastAccessedAt on every save
progressSchema.pre('save', function(next) {
  this.lastAccessedAt = new Date();
  if (this.completed && !this.completedAt) {
    this.completedAt = new Date();
  }
  next();
});

export default progressSchema;