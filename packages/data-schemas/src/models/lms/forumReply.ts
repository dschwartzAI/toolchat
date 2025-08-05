import forumReplySchema from '~/schema/lms/forumReply';
import type { IForumReply } from '~/schema/lms/forumReply';

/**
 * Creates or returns the ForumReply model using the provided mongoose instance and schema
 */
export function createForumReplyModel(mongoose: typeof import('mongoose')) {
  return mongoose.models.ForumReply || mongoose.model<IForumReply>('ForumReply', forumReplySchema);
}