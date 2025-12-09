import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ApplicantDocument = HydratedDocument<Applicant>;

/**
 * Applicant Schema
 * Stores applicant profile and email/password authentication info
 * Token storage is handled by OAuthAccount
 */
@Schema({
  collection: 'applicants',
  timestamps: true,
})
export class Applicant {
  _id: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop()
  phone?: string;

  @Prop()
  address?: string;

  @Prop()
  addressProvinceCode?: string;

  @Prop()
  addressProvinceName?: string;

  /**
   * ISO 3166-1 alpha-2 country code (e.g., 'VN', 'US')
   */
  @Prop({ required: true })
  country: string;

  /**
   * Street address (optional)
   */
  @Prop()
  street?: string;

  /**
   * City name (optional)
   */
  @Prop()
  city?: string;

  /**
   * Password hash for email/password authentication
   * Null if user only uses OAuth (Google)
   */
  @Prop()
  passwordHash?: string;

  /**
   * Email verification status
   */
  @Prop({ default: false })
  emailVerified: boolean;

  /**
   * Number of failed login attempts (for brute force protection)
   */
  @Prop({ default: 0 })
  loginAttempts: number;

  /**
   * Account lock expiration time (for brute force protection)
   */
  @Prop()
  lockUntil?: Date;

  @Prop()
  lastLoginAt?: Date;

  @Prop({ default: true })
  isActive: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export const ApplicantSchema = SchemaFactory.createForClass(Applicant);

// Indexes for performance and sharding support
// Primary shard key candidate: { country: 1, _id: 1 } (hashed for distribution)
ApplicantSchema.index({ country: 1, _id: 1 }); // Compound index for potential shard key
ApplicantSchema.index({ country: 1, email: 1 }); // Query by country + email
ApplicantSchema.index({ country: 1, createdAt: -1 }); // Query by country + date
ApplicantSchema.index({ emailVerified: 1 });
ApplicantSchema.index({ isActive: 1 });
ApplicantSchema.index({ lockUntil: 1 }, { expireAfterSeconds: 0 }); // TTL index for auto-unlock

/**
 * MongoDB Atlas Sharding Notes:
 * - Recommended shard key: { country: "hashed" } or { country: 1, _id: 1 }
 * - Country provides good data distribution across geographic regions
 * - Most queries will include country filter for efficient shard targeting
 * - Enable sharding in MongoDB Atlas console with:
 *   sh.enableSharding("ja_core")
 *   sh.shardCollection("ja_core.applicants", { country: "hashed" })
 */
