import moduleSchema from '~/schema/lms/module';
import type { IModule } from '~/schema/lms/module';

/**
 * Creates or returns the Module model using the provided mongoose instance and schema
 */
export function createModuleModel(mongoose: typeof import('mongoose')) {
  return mongoose.models.Module || mongoose.model<IModule>('Module', moduleSchema);
}