import courseSchema from '~/schema/lms/course';
import type { ICourse } from '~/schema/lms/course';

/**
 * Creates or returns the Course model using the provided mongoose instance and schema
 */
export function createCourseModel(mongoose: typeof import('mongoose')) {
  return mongoose.models.Course || mongoose.model<ICourse>('Course', courseSchema);
}