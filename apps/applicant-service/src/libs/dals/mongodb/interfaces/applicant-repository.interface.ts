import { IBaseMongoRepository } from './base-repository.interface';
import { Applicant } from '../schemas';

export interface IApplicantRepository extends IBaseMongoRepository<Applicant> {
  findByEmail(email: string): Promise<Applicant | null>;
  updateLastLogin(id: string): Promise<void>;
}
