import { Schema } from 'mongoose';
import type { Document } from 'mongoose';

export interface IForumReply extends Document {
  content: string;
  author: Schema.Types.ObjectId;
  post: Schema.Types.ObjectId;
  parentReply?: Schema.Types.ObjectId;
  likes: Schema.Types.ObjectId[];
  likeCount: number;
  isDeleted: boolean;
  editedAt?: Date;
  editedBy?: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const forumReplySchema = new Schema<IForumReply>(
  {
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000,
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    post: {
      type: Schema.Types.ObjectId,
      ref: 'ForumPost',
      required: true,
      index: true,
    },
    parentReply: {
      type: Schema.Types.ObjectId,
      ref: 'ForumReply',
      index: true,
    },
    likes: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
    }],
    likeCount: {
      type: Number,
      default: 0,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    editedAt: {
      type: Date,
    },
    editedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for efficient querying
forumReplySchema.index({ post: 1, isDeleted: 1, createdAt: 1 });
forumReplySchema.index({ author: 1, isDeleted: 1, createdAt: -1 });
forumReplySchema.index({ parentReply: 1, createdAt: 1 });

// Update likeCount when likes array changes
forumReplySchema.pre('save', function(next) {
  if (this.isModified('likes')) {
    this.likeCount = this.likes.length;
  }
  if (this.isModified('content')) {
    this.editedAt = new Date();
  }
  next();
});

export default forumReplySchema;