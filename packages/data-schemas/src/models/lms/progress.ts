import progressSchema from '~/schema/lms/progress';
import type { IProgress } from '~/schema/lms/progress';

/**
 * Creates or returns the Progress model using the provided mongoose instance and schema
 */
export function createProgressModel(mongoose: typeof import('mongoose')) {
  return mongoose.models.Progress || mongoose.model<IProgress>('Progress', progressSchema);
}