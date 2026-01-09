/**
 * Topic Payload Interfaces for DEVision Job Matching System
 * These define the structure of event payloads for each Kafka topic
 */

// ===========================================
// Common Types
// ===========================================

export type EmploymentType =
  | "FULL_TIME"
  | "PART_TIME"
  | "CONTRACT"
  | "INTERNSHIP"
  | "FRESHER";

export type SubscriptionTier = "NORMAL" | "PREMIUM";

export type SalaryType = "RANGE" | "ESTIMATION" | "NEGOTIABLE";

export type SalaryEstimationType = "ABOUT" | "UP_TO" | "FROM" | "NEGOTIABLE";

export interface ISalaryRange {
  min: number;
  max?: number;
  currency: string;
}

export interface IExperienceRange {
  min: number;
  max?: number;
}

// ===========================================
// Search Profile (shared between JA and JM)
// ===========================================

export interface ISearchProfilePayload {
  profileId: string;
  userId: string;
  userType: "APPLICANT" | "COMPANY";

  // Matching criteria
  desiredRoles: string[];
  skillIds: string[]; // Skill IDs from job-skill-service
  skillNames: string[]; // Cached skill names for display
  experienceYears: number;
  desiredLocations: string[];
  expectedSalary: ISalaryRange;
  employmentTypes: EmploymentType[];

  // Status
  isActive: boolean;
  isPremium: boolean;
  premiumExpiresAt?: string;
}

// ===========================================
// Subscription Event Payloads
// ===========================================

export interface IPremiumJACreatedPayload {
  applicantId: string;
  subscriptionId: string;
  subscriptionTier: SubscriptionTier;
  searchProfile: ISearchProfilePayload;
  startDate: string;
  endDate: string;
}

export interface IPremiumJAExpiredPayload {
  applicantId: string;
  subscriptionId: string;
  expiredAt: string;
}

export interface IPremiumJMCreatedPayload {
  companyId: string;
  subscriptionId: string;
  subscriptionTier: SubscriptionTier;
  searchProfile: {
    skillIds: string[]; // Skill IDs from job-skill-service
    skillNames: string[]; // Cached skill names for display
    experienceYears: IExperienceRange;
    locations: string[];
    salaryRange: ISalaryRange;
    educationLevel?: string;
  };
  activeJobIds: string[];
  startDate: string;
  endDate: string;
}

export interface IPremiumJMExpiredPayload {
  companyId: string;
  subscriptionId: string;
  expiredAt: string;
}

// ===========================================
// Profile Event Payloads
// ===========================================

export interface ISearchProfileCreatedPayload {
  profileId: string;
  userId: string;
  userType: "APPLICANT" | "COMPANY";
  searchProfile: ISearchProfilePayload;
  isPremium: boolean;
  createdAt: string;
}

export interface ISearchProfileUpdatedPayload {
  profileId: string;
  userId: string;
  userType: "APPLICANT" | "COMPANY";
  searchProfile: ISearchProfilePayload;
  changedFields: string[];
  isPremium: boolean;
}

// ===========================================
// Job Event Payloads
// ===========================================

export interface IJobCreatedPayload {
  jobId: string;
  companyId: string;
  companyName: string;
  title: string;
  description?: string;
  criteria: {
    requiredSkillIds: string[]; // Skill IDs from job-skill-service
    requiredSkillNames: string[]; // Cached skill names for display
    niceToHaveSkillIds?: string[]; // Optional nice-to-have skill IDs
    niceToHaveSkillNames?: string[]; // Optional nice-to-have skill names
    minExperience: number;
    maxExperience?: number;
    location: string;
    // Salary fields
    salaryType: SalaryType;
    salaryCurrency: string;
    salaryRange?: { min: number; max: number }; // for RANGE type
    salaryAmount?: number; // for ESTIMATION type
    salaryEstimationType?: SalaryEstimationType; // for ESTIMATION type
    employmentType: EmploymentType;
    isFresherFriendly: boolean;
  };
  postedAt: string;
  expiresAt?: string;
}

export interface IJobUpdatedPayload {
  jobId: string;
  companyId: string;
  criteria: IJobCreatedPayload["criteria"];
  changedFields: string[];
  updatedAt: string;
}

export interface IJobClosedPayload {
  jobId: string;
  companyId: string;
  reason: "EXPIRED" | "FILLED" | "CANCELLED" | "MANUAL";
  closedAt: string;
}

// ===========================================
// Matching Event Payloads
// ===========================================

export interface IMatchResult {
  matchedEntityId: string;
  matchedEntityType: "APPLICANT" | "JOB" | "COMPANY";
  matchScore: number;
  matchedCriteria: {
    skillIds: string[]; // Matched skill IDs
    skillNames: string[]; // Matched skill names for display
    location: boolean;
    salary: boolean;
    experience: boolean;
  };
}

export interface IMatchingJMToJACompletedPayload {
  companyId: string;
  triggeredBy: "PREMIUM_SUBSCRIPTION" | "PROFILE_UPDATE" | "JOB_CREATED";
  matches: IMatchResult[];
  totalMatches: number;
  processedAt: string;
}

export interface IMatchingJAToJMCompletedPayload {
  applicantId: string;
  triggeredBy: "PREMIUM_SUBSCRIPTION" | "PROFILE_UPDATE";
  matches: IMatchResult[];
  totalMatches: number;
  processedAt: string;
}
