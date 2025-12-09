import { Role } from '@auth/enums';

/**
 * Applicant data returned by auth operations
 * Gateway will generate JWT tokens based on this data
 */
export interface ApplicantAuthResponse {
  user: {
    id: string;
    email: string;
    name: string;
    role: Role;
    country?: string;
    emailVerified?: boolean;
  };
  provider: string; // 'email' | 'google'
}

/**
 * Token data for storage
 */
export interface TokenStorageData {
  applicantId: string;
  provider: string;
  accessToken: string;
  accessTokenExp: Date;
  refreshTokenHash: string;
  refreshTokenExp: Date;
}

/**
 * Registration data
 */
export interface RegisterData {
  name: string;
  email: string;
  password: string;
  country: string;
  phone?: string;
  street?: string;
  city?: string;
}

/**
 * Applicant Service Auth Interface
 * Note: Token generation is handled by API Gateway, not Applicant Service
 */
export interface IApplicantAuthService {
  /**
   * Register new applicant with email/password
   * Returns user data (Gateway generates tokens)
   */
  register(data: RegisterData): Promise<ApplicantAuthResponse>;

  /**
   * Verify email/password credentials
   * Returns user data (Gateway generates tokens)
   */
  verifyCredentials(email: string, password: string): Promise<ApplicantAuthResponse>;

  /**
   * Find or create applicant for OAuth login
   * Returns user data (Gateway generates tokens)
   */
  findOrCreateOAuthApplicant(
    provider: string,
    providerId: string,
    email: string,
    name: string,
    picture?: string,
  ): Promise<ApplicantAuthResponse>;

  /**
   * Validate refresh token hash and return user data
   * Gateway will verify JWT signature, then call this to validate stored hash
   */
  validateRefreshToken(
    applicantId: string,
    provider: string,
    refreshTokenHash: string,
  ): Promise<ApplicantAuthResponse>;

  /**
   * Store tokens for a applicant
   * Called by Gateway after generating new tokens
   */
  storeTokens(data: TokenStorageData): Promise<{ success: boolean }>;

  /**
   * Logout - clear tokens for a provider
   */
  logout(applicantId: string, provider?: string): Promise<{ message: string }>;
}
