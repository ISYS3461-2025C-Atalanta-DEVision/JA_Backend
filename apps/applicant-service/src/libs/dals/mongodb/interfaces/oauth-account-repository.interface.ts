import { IBaseMongoRepository } from "./base-repository.interface";
import { OAuthAccount } from "../schemas";

export interface TokenData {
  accessToken: string;
  accessTokenExp: Date;
  refreshTokenHash: string;
  refreshTokenExp: Date;
}

export interface IOAuthAccountRepository
  extends IBaseMongoRepository<OAuthAccount> {
  findByProviderAndId(
    provider: string,
    providerId: string,
  ): Promise<OAuthAccount | null>;
  findByApplicantId(applicantId: string): Promise<OAuthAccount[]>;
  findByApplicantIdAndProvider(
    applicantId: string,
    provider: string,
  ): Promise<OAuthAccount | null>;
  findByEmail(email: string): Promise<OAuthAccount[]>;

  /**
   * Store tokens for a applicant's provider account
   */
  storeTokens(
    applicantId: string,
    provider: string,
    tokenData: TokenData,
  ): Promise<void>;

  /**
   * Get refresh token hash for validation
   */
  getRefreshTokenHash(
    applicantId: string,
    provider: string,
  ): Promise<string | null>;

  /**
   * Clear tokens (logout)
   */
  clearTokens(applicantId: string, provider: string): Promise<void>;

  /**
   * Clear all tokens for a applicant (logout all)
   */
  clearAllTokens(applicantId: string): Promise<void>;

  updateProfile(
    provider: string,
    providerId: string,
    updates: Partial<OAuthAccount>,
  ): Promise<void>;

  /**
   * Update oauth account by applicantId and provider
   * Used to sync providerId (Firebase UID) and profile updates
   */
  updateByApplicantAndProvider(
    applicantId: string,
    provider: string,
    updates: Partial<OAuthAccount>,
  ): Promise<void>;

  deleteByProvider(provider: string, providerId: string): Promise<boolean>;
}
