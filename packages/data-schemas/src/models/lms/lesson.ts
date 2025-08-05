import lessonSchema from '~/schema/lms/lesson';
import type { ILesson } from '~/schema/lms/lesson';

/**
 * Creates or returns the Lesson model using the provided mongoose instance and schema
 */
export function createLessonModel(mongoose: typeof import('mongoose')) {
  return mongoose.models.Lesson || mongoose.model<ILesson>('Lesson', lessonSchema);
}