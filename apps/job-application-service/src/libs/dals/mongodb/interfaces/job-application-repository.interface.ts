import { IBaseMongoRepository } from './base-repository.interface';
import { JobApplication } from '../schemas';

export interface IJobApplicationRepository extends IBaseMongoRepository<JobApplication> {
  findByName(name: string): Promise<JobApplication | null>;
  // Add custom method signatures here
}
