import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type AdminApplicantDocument = HydratedDocument<AdminApplicant>;

/**
 * AdminApplicant Schema
 * Stores admin profile and email/password authentication info
 * Token storage is handled by AdminOAuthAccount
 */
@Schema({
  collection: 'admin-applicants',
  timestamps: true,
})
export class AdminApplicant {
  _id: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop()
  description?: string;

  /**
   * Password hash for email/password authentication
   * Null if user only uses OAuth (future)
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

export const AdminApplicantSchema =
  SchemaFactory.createForClass(AdminApplicant);

// Indexes for performance and auth
// Note: email unique index created via @Prop({ unique: true })
AdminApplicantSchema.index({ name: 1 });
AdminApplicantSchema.index({ emailVerified: 1 });
AdminApplicantSchema.index({ isActive: 1 });
AdminApplicantSchema.index({ lockUntil: 1 }); // Index for brute force protection queries
AdminApplicantSchema.index({ createdAt: -1 });

/**
 * MongoDB Sharding Notes:
 * - Recommended shard key: { _id: "hashed" } for even distribution
 * - Add compound indexes based on query patterns
 * - Enable sharding in MongoDB Atlas console with:
 *   sh.enableSharding("database_name")
 *   sh.shardCollection("database_name.admin-applicants", { _id: "hashed" })
 */
