import { IBaseMongoRepository } from './base-repository.interface';
import { AdminApplicant } from '../schemas';

export interface IAdminApplicantRepository extends IBaseMongoRepository<AdminApplicant> {
  findByName(name: string): Promise<AdminApplicant | null>;
  // Add custom method signatures here
}
