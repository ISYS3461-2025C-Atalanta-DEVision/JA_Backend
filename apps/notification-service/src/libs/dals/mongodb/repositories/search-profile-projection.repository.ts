import { Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import {
  SearchProfileProjection,
  EmploymentType,
} from "../schemas/search-profile-projection.schema";
import {
  ISearchProfileProjectionRepository,
  IJobMatchCriteria,
  IProfileMatchResult,
} from "../interfaces/search-profile-projection-repository.interface";

@Injectable()
export class SearchProfileProjectionRepository
  implements ISearchProfileProjectionRepository
{
  private readonly logger = new Logger(SearchProfileProjectionRepository.name);

  constructor(
    @InjectModel(SearchProfileProjection.name)
    private readonly model: Model<SearchProfileProjection>,
  ) {}

  async upsertByProfileId(
    profileId: string,
    data: Partial<SearchProfileProjection>,
  ): Promise<SearchProfileProjection> {
    const result = await this.model
      .findOneAndUpdate(
        { profileId },
        { $set: { ...data, profileId } },
        { new: true, upsert: true },
      )
      .lean()
      .exec();
    return result as SearchProfileProjection;
  }

  async findByProfileId(
    profileId: string,
  ): Promise<SearchProfileProjection | null> {
    return (await this.model
      .findOne({ profileId })
      .lean()
      .exec()) as SearchProfileProjection | null;
  }

  async findByApplicantId(
    applicantId: string,
  ): Promise<SearchProfileProjection | null> {
    return (await this.model
      .findOne({ applicantId })
      .lean()
      .exec()) as SearchProfileProjection | null;
  }

  async findActivePremiumProfiles(): Promise<SearchProfileProjection[]> {
    const now = new Date();
    return (await this.model
      .find({
        isActive: true,
        isPremium: true,
        $or: [
          { premiumExpiresAt: { $exists: false } },
          { premiumExpiresAt: null },
          { premiumExpiresAt: { $gt: now } },
        ],
      })
      .lean()
      .exec()) as SearchProfileProjection[];
  }

  /**
   * Find profiles matching job criteria with scoring
   * Implements requirement 5.3.1: instantly evaluate new job posts against active subscribers
   *
   * Matching logic per requirements 5.2.1-5.2.4:
   * - Skills match (5.2.2)
   * - Employment type match (5.2.3)
   * - Location match (5.2.1)
   * - Salary range match (5.2.4)
   * - Role/title match (5.2.1)
   */
  async findMatchingProfiles(
    criteria: IJobMatchCriteria,
  ): Promise<IProfileMatchResult[]> {
    const now = new Date();

    // Get all active premium profiles
    const profiles = await this.model
      .find({
        isActive: true,
        isPremium: true,
        $or: [
          { premiumExpiresAt: { $exists: false } },
          { premiumExpiresAt: null },
          { premiumExpiresAt: { $gt: now } },
        ],
      })
      .lean()
      .exec();

    const results: IProfileMatchResult[] = [];

    for (const profile of profiles) {
      const matchResult = this.calculateMatchScore(
        profile as SearchProfileProjection,
        criteria,
      );

      // Only include profiles with at least one matching criterion
      if (matchResult.matchScore > 0) {
        results.push(matchResult);
      }
    }

    // Sort by match score descending
    results.sort((a, b) => b.matchScore - a.matchScore);

    this.logger.log(
      `Found ${results.length} matching profiles for job ${criteria.jobId}`,
    );

    return results;
  }

  /**
   * Calculate match score between a profile and job criteria
   * Returns a score from 0-100 based on how well the profile matches
   *
   * Uses EXACT skill ID matching (no fuzzy string comparison)
   */
  private calculateMatchScore(
    profile: SearchProfileProjection,
    criteria: IJobMatchCriteria,
  ): IProfileMatchResult {
    let score = 0;
    const weights = {
      skills: 35, // 35% weight for skills match
      location: 25, // 25% weight for location match
      salary: 20, // 20% weight for salary match
      employmentType: 10, // 10% weight for employment type
      roleMatch: 10, // 10% weight for role/title match
    };

    const matchedCriteria = {
      skillIds: [] as string[],
      skillNames: [] as string[],
      location: false,
      salary: false,
      employmentType: false,
      roleMatch: false,
    };

    // 1. Skills matching using EXACT ID comparison (requirement 5.2.2)
    if (profile.skillIds?.length > 0 && criteria.requiredSkillIds?.length > 0) {
      // Exact ID matching - no case issues, 100% reliable
      matchedCriteria.skillIds = profile.skillIds.filter((id) =>
        criteria.requiredSkillIds.includes(id),
      );

      // Get corresponding skill names for display
      matchedCriteria.skillNames = matchedCriteria.skillIds.map((id) => {
        const index = profile.skillIds.indexOf(id);
        return profile.skillNames?.[index] || id;
      });

      const skillMatchRatio =
        matchedCriteria.skillIds.length / criteria.requiredSkillIds.length;
      score += skillMatchRatio * weights.skills;
    }

    // 2. Location matching (requirement 5.2.1)
    if (profile.desiredLocations?.length > 0 && criteria.location) {
      const locationLower = criteria.location.toLowerCase();
      const locationMatch = profile.desiredLocations.some(
        (loc) =>
          loc.toLowerCase() === locationLower ||
          locationLower.includes(loc.toLowerCase()) ||
          loc.toLowerCase().includes(locationLower),
      );

      if (locationMatch) {
        matchedCriteria.location = true;
        score += weights.location;
      }
    } else if (!profile.desiredLocations?.length) {
      // No location preference means any location is acceptable
      matchedCriteria.location = true;
      score += weights.location;
    }

    // 3. Salary matching (requirement 5.2.4)
    const salaryMatch = this.checkSalaryMatch(profile, criteria);
    if (salaryMatch) {
      matchedCriteria.salary = true;
      score += weights.salary;
    }

    // 4. Employment type matching (requirement 5.2.3)
    const employmentMatch = this.checkEmploymentTypeMatch(profile, criteria);
    if (employmentMatch) {
      matchedCriteria.employmentType = true;
      score += weights.employmentType;
    }

    // 5. Role/title matching (requirement 5.2.1)
    if (profile.desiredRoles?.length > 0 && criteria.title) {
      const titleLower = criteria.title.toLowerCase();
      const roleMatch = profile.desiredRoles.some((role) => {
        const roleLower = role.toLowerCase();
        return (
          titleLower.includes(roleLower) ||
          roleLower.includes(titleLower) ||
          this.fuzzyMatch(roleLower, titleLower)
        );
      });

      if (roleMatch) {
        matchedCriteria.roleMatch = true;
        score += weights.roleMatch;
      }
    } else if (!profile.desiredRoles?.length) {
      // No role preference means any role is acceptable
      matchedCriteria.roleMatch = true;
      score += weights.roleMatch;
    }

    return {
      profile,
      matchScore: Math.round(score),
      matchedCriteria,
    };
  }

  /**
   * Check if job salary matches profile expected salary
   * Per requirement 5.2.4: includes jobs with undeclared salary
   */
  private checkSalaryMatch(
    profile: SearchProfileProjection,
    criteria: IJobMatchCriteria,
  ): boolean {
    // If job has no salary info, include it (per 5.2.4)
    if (!criteria.salaryMin && !criteria.salaryMax) {
      return true;
    }

    // If profile has no salary preference, match any salary
    if (!profile.expectedSalary || profile.expectedSalary.min === 0) {
      return true;
    }

    const profileMin = profile.expectedSalary.min || 0;
    const profileMax = profile.expectedSalary.max || Infinity;
    const jobMin = criteria.salaryMin || 0;
    const jobMax = criteria.salaryMax || Infinity;

    // Check if salary ranges overlap
    return jobMax >= profileMin && jobMin <= profileMax;
  }

  /**
   * Check if job employment type matches profile preferences
   * Per requirement 5.2.3: if neither FULL_TIME nor PART_TIME specified,
   * include both FULL_TIME and PART_TIME jobs
   */
  private checkEmploymentTypeMatch(
    profile: SearchProfileProjection,
    criteria: IJobMatchCriteria,
  ): boolean {
    // If profile has no preference, handle per requirement 5.2.3
    if (!profile.employmentTypes?.length) {
      // Default to FULL_TIME and PART_TIME if not specified
      return [EmploymentType.FULL_TIME, EmploymentType.PART_TIME].includes(
        criteria.employmentType,
      );
    }

    // Check for fresher-friendly jobs
    if (
      criteria.isFresherFriendly &&
      profile.employmentTypes.includes(EmploymentType.FRESHER)
    ) {
      return true;
    }

    return profile.employmentTypes.includes(criteria.employmentType);
  }

  /**
   * Simple fuzzy matching for role titles
   */
  private fuzzyMatch(str1: string, str2: string): boolean {
    // Split into words and check for common significant words
    const words1 = str1.split(/\s+/).filter((w) => w.length > 2);
    const words2 = str2.split(/\s+/).filter((w) => w.length > 2);

    const commonWords = words1.filter((w) => words2.includes(w));
    return commonWords.length >= 1;
  }

  async updatePremiumStatus(
    applicantId: string,
    isPremium: boolean,
    expiresAt?: Date,
  ): Promise<boolean> {
    const updateData: any = { isPremium };
    if (expiresAt) {
      updateData.premiumExpiresAt = expiresAt;
    }

    const result = await this.model
      .findOneAndUpdate({ applicantId }, { $set: updateData })
      .exec();

    return result !== null;
  }

  async deactivate(profileId: string): Promise<boolean> {
    const result = await this.model
      .findOneAndUpdate({ profileId }, { $set: { isActive: false } })
      .exec();

    return result !== null;
  }

  async deleteByProfileId(profileId: string): Promise<boolean> {
    const result = await this.model.deleteOne({ profileId }).exec();
    return result.deletedCount > 0;
  }
}
