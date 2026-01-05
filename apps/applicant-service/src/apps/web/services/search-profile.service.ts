import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { SearchProfileRepository, SearchProfile, EmploymentType } from '../../../libs/dals/mongodb';
import { KafkaService } from '@kafka/kafka.service';
import { TOPIC_PROFILE_JA_SEARCH_PROFILE_UPDATED } from '@kafka/constants';
import { ISearchProfilePayload } from '@kafka/interfaces';

export interface UpsertSearchProfileDto {
  desiredRoles?: string[];
  skills?: string[];
  experienceYears?: number;
  desiredLocations?: string[];
  expectedSalary?: {
    min: number;
    max?: number;
    currency: string;
  };
  employmentTypes?: EmploymentType[];
  isActive?: boolean;
}

@Injectable()
export class SearchProfileService {
  private readonly logger = new Logger(SearchProfileService.name);

  constructor(
    private readonly searchProfileRepository: SearchProfileRepository,
    private readonly kafkaService: KafkaService,
  ) {}

  /**
   * Get search profile by applicant ID
   */
  async getByApplicantId(applicantId: string): Promise<SearchProfile | null> {
    return this.searchProfileRepository.findByApplicantId(applicantId);
  }

  /**
   * Upsert search profile and publish Kafka event
   */
  async upsert(
    applicantId: string,
    data: UpsertSearchProfileDto,
  ): Promise<SearchProfile> {
    // Get existing profile to determine changed fields
    const existingProfile = await this.searchProfileRepository.findByApplicantId(applicantId);
    const isCreate = !existingProfile;

    // Upsert the profile
    const result = await this.searchProfileRepository.upsertByApplicantId(applicantId, data);

    // Determine changed fields
    const changedFields = this.getChangedFields(existingProfile, data);

    // Publish Kafka event
    try {
      const payload: ISearchProfilePayload = {
        profileId: result._id.toString(),
        userId: applicantId,
        userType: 'APPLICANT',
        desiredRoles: result.desiredRoles || [],
        skills: result.skills || [],
        experienceYears: result.experienceYears || 0,
        desiredLocations: result.desiredLocations || [],
        expectedSalary: result.expectedSalary || { min: 0, currency: 'USD' },
        employmentTypes: (result.employmentTypes || []) as any,
        isActive: result.isActive,
        isPremium: false, // Premium status managed by Job Manager
      };

      await this.kafkaService.publish(
        TOPIC_PROFILE_JA_SEARCH_PROFILE_UPDATED,
        'profile.ja.search-profile.updated',
        {
          profileId: result._id.toString(),
          userId: applicantId,
          userType: 'APPLICANT',
          searchProfile: payload,
          changedFields: isCreate ? ['all'] : changedFields,
          isPremium: false,
        },
      );

      this.logger.log(
        `Published profile update event for applicant ${applicantId}, changed: ${changedFields.join(', ')}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to publish Kafka event for applicant ${applicantId}`,
        error.stack,
      );
      // Don't throw - profile was saved, Kafka is non-critical
    }

    return result;
  }

  /**
   * Deactivate search profile
   */
  async deactivate(applicantId: string): Promise<boolean> {
    const result = await this.searchProfileRepository.deactivate(applicantId);
    if (!result) {
      throw new NotFoundException(`Search profile for applicant ${applicantId} not found`);
    }
    return result;
  }

  /**
   * Activate search profile
   */
  async activate(applicantId: string): Promise<boolean> {
    const result = await this.searchProfileRepository.activate(applicantId);
    if (!result) {
      throw new NotFoundException(`Search profile for applicant ${applicantId} not found`);
    }
    return result;
  }

  /**
   * Get changed fields between existing and new data
   */
  private getChangedFields(
    existing: SearchProfile | null,
    newData: UpsertSearchProfileDto,
  ): string[] {
    if (!existing) return ['all'];

    const changedFields: string[] = [];

    if (newData.desiredRoles !== undefined) {
      const oldRoles = (existing.desiredRoles || []).sort().join(',');
      const newRoles = (newData.desiredRoles || []).sort().join(',');
      if (oldRoles !== newRoles) changedFields.push('desiredRoles');
    }

    if (newData.skills !== undefined) {
      const oldSkills = (existing.skills || []).sort().join(',');
      const newSkills = (newData.skills || []).sort().join(',');
      if (oldSkills !== newSkills) changedFields.push('skills');
    }

    if (newData.experienceYears !== undefined && existing.experienceYears !== newData.experienceYears) {
      changedFields.push('experienceYears');
    }

    if (newData.desiredLocations !== undefined) {
      const oldLocations = (existing.desiredLocations || []).sort().join(',');
      const newLocations = (newData.desiredLocations || []).sort().join(',');
      if (oldLocations !== newLocations) changedFields.push('desiredLocations');
    }

    if (newData.expectedSalary !== undefined) {
      const oldSalary = existing.expectedSalary;
      const newSalary = newData.expectedSalary;
      if (
        oldSalary?.min !== newSalary?.min ||
        oldSalary?.max !== newSalary?.max ||
        oldSalary?.currency !== newSalary?.currency
      ) {
        changedFields.push('expectedSalary');
      }
    }

    if (newData.employmentTypes !== undefined) {
      const oldTypes = (existing.employmentTypes || []).sort().join(',');
      const newTypes = (newData.employmentTypes || []).sort().join(',');
      if (oldTypes !== newTypes) changedFields.push('employmentTypes');
    }

    if (newData.isActive !== undefined && existing.isActive !== newData.isActive) {
      changedFields.push('isActive');
    }

    return changedFields.length > 0 ? changedFields : ['none'];
  }
}
