import { IBaseMongoRepository } from './base-repository.interface';
import { JobCategory } from '../schemas';

export interface IJobCategoryRepository extends IBaseMongoRepository<JobCategory> {
  findByName(name: string): Promise<JobCategory | null>;
  // Add custom method signatures here
}
