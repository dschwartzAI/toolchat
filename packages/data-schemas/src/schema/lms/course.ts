import { Schema } from 'mongoose';
import type { Document } from 'mongoose';

export interface ICourse extends Document {
  title: string;
  description?: string;
  thumbnail?: string;
  author: Schema.Types.ObjectId;
  modules: Schema.Types.ObjectId[];
  isPublished: boolean;
  order: number;
  tags: string[];
  enrollmentCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

const courseSchema = new Schema<ICourse>(
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
      maxlength: 2000,
    },
    thumbnail: {
      type: String,
      trim: true,
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    modules: [{
      type: Schema.Types.ObjectId,
      ref: 'Module',
    }],
    isPublished: {
      type: Boolean,
      default: false,
      index: true,
    },
    order: {
      type: Number,
      default: 0,
    },
    tags: [{
      type: String,
      trim: true,
    }],
    enrollmentCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
courseSchema.index({ isPublished: 1, order: 1 });
courseSchema.index({ tags: 1 });
courseSchema.index({ author: 1, isPublished: 1 });

export default courseSchema;