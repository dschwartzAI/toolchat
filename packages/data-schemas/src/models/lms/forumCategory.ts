import forumCategorySchema from '~/schema/lms/forumCategory';
import type { IForumCategory } from '~/schema/lms/forumCategory';

/**
 * Creates or returns the ForumCategory model using the provided mongoose instance and schema
 */
export function createForumCategoryModel(mongoose: typeof import('mongoose')) {
  return mongoose.models.ForumCategory || mongoose.model<IForumCategory>('ForumCategory', forumCategorySchema);
}