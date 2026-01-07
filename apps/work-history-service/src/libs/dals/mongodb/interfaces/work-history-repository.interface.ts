import { IBaseMongoRepository } from './base-repository.interface';
import { WorkHistory } from '../schemas';

export interface IWorkHistoryRepository extends IBaseMongoRepository<WorkHistory> {
  findByName(name: string): Promise<WorkHistory | null>;
  // Add custom method signatures here
}
