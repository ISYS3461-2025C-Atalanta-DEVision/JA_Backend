import {
  SearchProfileProjection,
  EmploymentType,
} from '../schemas/search-profile-projection.schema';

export const SEARCH_PROFILE_PROJECTION_REPO_PROVIDER = Symbol(
  'SearchProfileProjectionRepositoryProvider',
);

/**
 * Job criteria for matching against search profiles
 * Uses skill IDs from job-skill-service for exact matching
 */
export interface IJobMatchCriteria {
  jobId: string;
  title: string;
  requiredSkillIds: string[];       // Skill IDs from job-skill-service
  requiredSkillNames: string[];     // Cached names for display
  location: string;
  salaryMin?: number;
  salaryMax?: number;
  currency?: string;
  employmentType: EmploymentType;
  isFresherFriendly: boolean;
}

/**
 * Match result with score
 * Includes both skill IDs and names for notifications
 */
export interface IProfileMatchResult {
  profile: SearchProfileProjection;
  matchScore: number;
  matchedCriteria: {
    skillIds: string[];       // Matched skill IDs (for data)
    skillNames: string[];     // Matched skill names (for display)
    location: boolean;
    salary: boolean;
    employmentType: boolean;
    roleMatch: boolean;
  };
}

export interface ISearchProfileProjectionRepository {
  /**
   * Create or update a search profile projection
   */
  upsertByProfileId(
    profileId: string,
    data: Partial<SearchProfileProjection>,
  ): Promise<SearchProfileProjection>;

  /**
   * Find profile by profileId
   */
  findByProfileId(profileId: string): Promise<SearchProfileProjection | null>;

  /**
   * Find profile by applicantId
   */
  findByApplicantId(
    applicantId: string,
  ): Promise<SearchProfileProjection | null>;

  /**
   * Find all active premium profiles for matching
   */
  findActivePremiumProfiles(): Promise<SearchProfileProjection[]>;

  /**
   * Find active premium profiles matching job criteria
   * This is the core matching function for requirement 5.3.1
   */
  findMatchingProfiles(criteria: IJobMatchCriteria): Promise<IProfileMatchResult[]>;

  /**
   * Update premium status for a profile
   */
  updatePremiumStatus(
    applicantId: string,
    isPremium: boolean,
    expiresAt?: Date,
  ): Promise<boolean>;

  /**
   * Deactivate a profile
   */
  deactivate(profileId: string): Promise<boolean>;

  /**
   * Delete a profile
   */
  deleteByProfileId(profileId: string): Promise<boolean>;
}
