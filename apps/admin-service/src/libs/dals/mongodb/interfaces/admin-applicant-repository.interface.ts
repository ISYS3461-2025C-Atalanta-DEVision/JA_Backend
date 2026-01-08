import { IBaseMongoRepository } from "./base-repository.interface";
import { AdminApplicant } from "../schemas";

export interface IAdminApplicantRepository
  extends IBaseMongoRepository<AdminApplicant> {
  findByName(name: string): Promise<AdminApplicant | null>;
  findByEmail(email: string): Promise<AdminApplicant | null>;
  incrementLoginAttempts(id: string): Promise<void>;
  lockAccount(id: string, lockUntil: Date): Promise<void>;
  resetLoginAttempts(id: string): Promise<void>;
  updateLastLogin(id: string): Promise<void>;
}
