import { Schema } from 'mongoose';
import type { Document } from 'mongoose';

export interface IForumCategory extends Document {
  name: string;
  description?: string;
  slug: string;
  icon?: string;
  order: number;
  isActive: boolean;
  postCount: number;
  lastPostAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const forumCategorySchema = new Schema<IForumCategory>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    icon: {
      type: String,
      trim: true,
    },
    order: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    postCount: {
      type: Number,
      default: 0,
    },
    lastPostAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Index for ordering active categories
forumCategorySchema.index({ isActive: 1, order: 1 });

export default forumCategorySchema;