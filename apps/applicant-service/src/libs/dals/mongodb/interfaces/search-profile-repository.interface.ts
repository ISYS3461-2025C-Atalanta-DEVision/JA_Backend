import { IBaseMongoRepository } from './base-repository.interface';
import { SearchProfile } from '../schemas';

export interface ISearchProfileRepository
  extends IBaseMongoRepository<SearchProfile> {
  findByApplicantId(applicantId: string): Promise<SearchProfile | null>;
  findActiveProfiles(): Promise<SearchProfile[]>;
  findBySkillIds(skillIds: string[]): Promise<SearchProfile[]>;
  findByLocations(locations: string[]): Promise<SearchProfile[]>;
  upsertByApplicantId(
    applicantId: string,
    data: Partial<SearchProfile>,
  ): Promise<SearchProfile>;
  deactivate(applicantId: string): Promise<boolean>;
  activate(applicantId: string): Promise<boolean>;
}
