import { Schema } from 'mongoose';
import type { Document } from 'mongoose';

export interface ILesson extends Document {
  title: string;
  description?: string;
  module: Schema.Types.ObjectId;
  type: 'video' | 'text' | 'quiz';
  content?: string; // Markdown content for text lessons
  videoUrl?: string;
  videoProvider?: 'youtube' | 'vimeo' | 'custom';
  videoDuration?: number; // Duration in seconds
  order: number;
  resources?: Array<{
    title: string;
    url: string;
    type: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const lessonSchema = new Schema<ILesson>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    module: {
      type: Schema.Types.ObjectId,
      ref: 'Module',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['video', 'text', 'quiz'],
      required: true,
    },
    content: {
      type: String,
      trim: true,
    },
    videoUrl: {
      type: String,
      trim: true,
    },
    videoProvider: {
      type: String,
      enum: ['youtube', 'vimeo', 'custom'],
    },
    videoDuration: {
      type: Number,
      default: 0,
    },
    order: {
      type: Number,
      default: 0,
    },
    resources: [{
      title: {
        type: String,
        required: true,
      },
      url: {
        type: String,
        required: true,
      },
      type: {
        type: String,
        default: 'document',
      },
    }],
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient lesson ordering within a module
lessonSchema.index({ module: 1, order: 1 });
lessonSchema.index({ type: 1 });

export default lessonSchema;