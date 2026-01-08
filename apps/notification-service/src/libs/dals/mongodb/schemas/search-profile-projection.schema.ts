import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

export type SearchProfileProjectionDocument =
  HydratedDocument<SearchProfileProjection>;

/**
 * Employment types for job matching
 */
export enum EmploymentType {
  FULL_TIME = "FULL_TIME",
  PART_TIME = "PART_TIME",
  CONTRACT = "CONTRACT",
  INTERNSHIP = "INTERNSHIP",
  FRESHER = "FRESHER",
}

/**
 * Salary range subdocument
 */
@Schema({ _id: false })
export class SalaryRange {
  @Prop({ required: true, default: 0 })
  min: number;

  @Prop()
  max?: number;

  @Prop({ required: true, default: "USD" })
  currency: string;
}

/**
 * Search Profile Projection Schema
 * Local projection of applicant search profiles for real-time job matching
 * Synced via Kafka events from applicant-service
 *
 * Per requirement 5.3.1: Kafka consumer service must instantly evaluate
 * incoming new job posts against criteria of all active subscribers
 */
@Schema({
  collection: "search_profile_projections",
  timestamps: true,
})
export class SearchProfileProjection {
  _id: Types.ObjectId;

  /**
   * Profile ID from applicant-service (unique)
   */
  @Prop({ required: true, unique: true, index: true })
  profileId: string;

  /**
   * Applicant ID for sending notifications
   */
  @Prop({ required: true, index: true })
  applicantId: string;

  /**
   * Applicant email for email notifications
   */
  @Prop()
  applicantEmail?: string;

  // ===========================================
  // Matching Criteria (from Search Profile)
  // ===========================================

  /**
   * Desired job roles/titles (requirement 5.2.1)
   */
  @Prop({ type: [String], default: [] })
  desiredRoles: string[];

  /**
   * Technical skill IDs from job-skill-service (requirement 5.2.2)
   * References to skills collection in job-skill-service
   */
  @Prop({ type: [String], default: [], index: true })
  skillIds: string[];

  /**
   * Cached skill names for display (denormalized)
   * Avoids lookup calls when displaying notifications
   */
  @Prop({ type: [String], default: [] })
  skillNames: string[];

  /**
   * Years of experience
   */
  @Prop({ default: 0 })
  experienceYears: number;

  /**
   * Desired work locations (countries/cities)
   */
  @Prop({ type: [String], default: [], index: true })
  desiredLocations: string[];

  /**
   * Expected salary range (requirement 5.2.4)
   */
  @Prop({ type: SalaryRange, default: { min: 0, currency: "USD" } })
  expectedSalary: SalaryRange;

  /**
   * Desired employment types (requirement 5.2.3)
   */
  @Prop({ type: [String], enum: EmploymentType, default: [] })
  employmentTypes: EmploymentType[];

  /**
   * Whether profile is active for matching
   */
  @Prop({ default: true, index: true })
  isActive: boolean;

  /**
   * Premium subscription status (only premium users receive notifications)
   */
  @Prop({ default: false, index: true })
  isPremium: boolean;

  /**
   * Premium subscription expiry date
   */
  @Prop()
  premiumExpiresAt?: Date;

  // ===========================================
  // Timestamps
  // ===========================================

  createdAt: Date;
  updatedAt: Date;
}

export const SearchProfileProjectionSchema = SchemaFactory.createForClass(
  SearchProfileProjection,
);

// ===========================================
// Indexes for Matching Performance
// ===========================================

// Compound index for finding active premium profiles by location
SearchProfileProjectionSchema.index({
  isActive: 1,
  isPremium: 1,
  desiredLocations: 1,
});

// Compound index for finding active premium profiles by skillIds
SearchProfileProjectionSchema.index({
  isActive: 1,
  isPremium: 1,
  skillIds: 1,
});

// Index for checking premium expiry
SearchProfileProjectionSchema.index({ isPremium: 1, premiumExpiresAt: 1 });
