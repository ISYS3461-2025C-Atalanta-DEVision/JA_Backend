import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type OAuthAccountDocument = HydratedDocument<OAuthAccount>;

/**
 * OAuth Account Schema
 * Stores OAuth provider info and JWT tokens for a applicant
 *
 * Each applicant can have multiple OAuth accounts (email, google)
 * Tokens are stored here instead of applicant model for:
 * - Better separation of concerns
 * - Support for multiple sessions/providers
 * - Easier token revocation per provider
 */
@Schema({
  collection: 'oauth_accounts',
  timestamps: true,
})
export class OAuthAccount {
  _id: Types.ObjectId;

  /**
   * Reference to applicant
   */
  @Prop({ required: true })
  applicantId: string;

  /**
   * OAuth provider: 'email' | 'google'
   * - 'email': For email/password authentication
   * - 'google': For Firebase Google OAuth
   */
  @Prop({ required: true })
  provider: string;

  /**
   * Provider-specific ID
   * - For 'email': same as applicant email
   * - For 'google': Firebase UID
   */
  @Prop({ required: true })
  providerId: string;

  /**
   * Provider email (may differ from applicant email for linked accounts)
   */
  @Prop()
  email?: string;

  /**
   * Provider display name
   */
  @Prop()
  name?: string;

  /**
   * Provider profile picture URL
   */
  @Prop()
  picture?: string;

  // ============= Token Storage =============

  /**
   * Current access token (JWT)
   * Stored for reference/debugging, not used for validation
   * Gateway validates JWT signature directly
   */
  @Prop()
  accessToken?: string;

  /**
   * Access token expiration time
   */
  @Prop()
  accessTokenExp?: Date;

  /**
   * Refresh token hash (SHA-256)
   * We store hash, not plain token, for security
   */
  @Prop()
  refreshTokenHash?: string;

  /**
   * Refresh token expiration time
   */
  @Prop()
  refreshTokenExp?: Date;

  /**
   * Last token refresh timestamp
   */
  @Prop()
  lastRefreshAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

export const OAuthAccountSchema = SchemaFactory.createForClass(OAuthAccount);

// Create indexes for common queries
OAuthAccountSchema.index({ applicantId: 1 });
OAuthAccountSchema.index({ provider: 1, providerId: 1 });
// Unique: one oauth account per applicant per provider (prevents duplicates)
OAuthAccountSchema.index({ applicantId: 1, provider: 1 }, { unique: true });
OAuthAccountSchema.index({ email: 1 });
