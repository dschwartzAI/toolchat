import forumPostSchema from '~/schema/lms/forumPost';
import type { IForumPost } from '~/schema/lms/forumPost';

/**
 * Creates or returns the ForumPost model using the provided mongoose instance and schema
 */
export function createForumPostModel(mongoose: typeof import('mongoose')) {
  return mongoose.models.ForumPost || mongoose.model<IForumPost>('ForumPost', forumPostSchema);
}