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

export type SalaryType = "RANGE" | "ESTIMATION" | "NEGOTIABLE";

export type SalaryEstimationType = "ABOUT" | "UP_TO" | "FROM" | "NEGOTIABLE";

export interface ISalaryRange {
  min: number;
  max?: number;
  currency: string;
}

// ===========================================
// Application Event Payloads
// ===========================================

export interface IJobApplicationCreated {
  applicantId: string;
  jobId: string;
  mediaUrls: string[];
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
  desiredLocations: string[];
  expectedSalary: ISalaryRange;
  employmentTypes: EmploymentType[];

  // Status
  isActive: boolean;
  isPremium: boolean;
}

// ===========================================
// Subscription Event Payloads
// ===========================================
export type SubscriptionTier = "NORMAL" | "PREMIUM";

export interface IPremiumJACreatedPayload {
  applicantId: string;
  subscriptionId: string;
  subscriptionTier: SubscriptionTier;
  startDate: string;
  endDate: string;
}

export interface IPremiumJAExpiredPayload {
  applicantId: string;
  subscriptionId: string;
  expiredAt: string;
}

export interface IPremiumJAClosedPayload {
  applicantId: string;
  subscriptionId: string;
  closedAt: string;
}

// ===========================================
// Profile Event Payloads
// ===========================================

/**
 * Payload for applicant profile updates (skills/country changes)
 * Used by Job Manager to trigger headhunt matching
 */
export interface IApplicantProfileUpdatedPayload {
  applicantId: string;
  changedFields: ("skillCategories" | "country")[];
  // Current values
  skillCategories?: string[];
  country?: string;
  // For country migration tracking
  previousCountry?: string;
  // Metadata
  isPremium: boolean;
}

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
