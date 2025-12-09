import { IBaseMongoRepository } from './base-repository.interface';
import { Applicant } from '../schemas';

export interface IApplicantRepository extends IBaseMongoRepository<Applicant> {
  findByEmail(email: string): Promise<Applicant | null>;
  updateLastLogin(id: string): Promise<void>;
  incrementLoginAttempts(id: string): Promise<void>;
  resetLoginAttempts(id: string): Promise<void>;
  lockAccount(id: string, lockUntil: Date): Promise<void>;
}
