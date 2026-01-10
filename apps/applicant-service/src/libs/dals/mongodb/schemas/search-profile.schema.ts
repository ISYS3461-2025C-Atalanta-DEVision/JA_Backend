import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

export type SearchProfileDocument = HydratedDocument<SearchProfile>;

/**
 * Employment types for job search
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
 * Search Profile Schema
 * Stores applicant's job search criteria for matching with job posts
 * Used by premium applicants to receive real-time job notifications
 *
 * Note: Premium subscription status is managed by Job Manager system.
 * This schema only stores the search criteria.
 */
@Schema({
  collection: "search_profiles",
  timestamps: true,
})
export class SearchProfile {
  _id: Types.ObjectId;

  /**
   * Reference to applicant (required, unique per applicant)
   */
  @Prop({ required: true, unique: true, index: true })
  applicantId: string;

  // ===========================================
  // Matching Criteria
  // ===========================================

  /**
   * Desired job roles/titles (e.g., "Software Engineer", "Backend Developer")
   * Semicolon-separated as per requirement 5.2.1
   */
  @Prop({ type: [String], default: [] })
  desiredRoles: string[];

  /**
   * Skill IDs from job-skill-service
   * References to skills collection in job-skill-service MongoDB
   * Used for EXACT matching with job requirements (requirement 5.2.2)
   */
  @Prop({ type: [String], default: [], index: true })
  skillIds: string[];

  /**
   * Desired work locations (countries or cities)
   * Country uses ISO 3166-1 alpha-2 codes
   */
  @Prop({ type: [String], default: [], index: true })
  desiredLocations: string[];

  /**
   * Expected salary range (requirement 5.2.4)
   * If min is not set, defaults to 0
   * If max is not set, no upper limit
   */
  @Prop({ type: SalaryRange, default: { min: 0, currency: "USD" } })
  expectedSalary: SalaryRange;

  /**
   * Desired employment types (requirement 5.2.3)
   * If empty, matches both FULL_TIME and PART_TIME
   */
  @Prop({ type: [String], enum: EmploymentType, default: [] })
  employmentTypes: EmploymentType[];

  /**
   * Whether the profile is actively used for matching
   */
  @Prop({ default: true })
  isActive: boolean;

  // ===========================================
  // Timestamps
  // ===========================================

  createdAt: Date;
  updatedAt: Date;
}

export const SearchProfileSchema = SchemaFactory.createForClass(SearchProfile);

// ===========================================
// Indexes for Performance
// ===========================================

// Index for finding profiles by location (for matching)
SearchProfileSchema.index({ isActive: 1, desiredLocations: 1 });

// Index for finding profiles by skill IDs (for matching)
SearchProfileSchema.index({ isActive: 1, skillIds: 1 });

// Text index for full-text search on roles
SearchProfileSchema.index({ desiredRoles: "text" });
