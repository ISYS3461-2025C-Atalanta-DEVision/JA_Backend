import { Role } from "@auth/enums";

/**
 * Admin data returned by auth operations
 * Gateway will generate JWT tokens based on this data
 */
export interface AdminAuthResponse {
  user: {
    id: string;
    email: string;
    name: string;
    role: Role;
    emailVerified?: boolean;
  };
  provider: string; // 'email'
}

/**
 * Token data for storage
 */
export interface TokenStorageData {
  adminId: string;
  provider: string;
  accessToken: string;
  accessTokenExp: Date;
  refreshTokenHash: string;
  refreshTokenExp: Date;
}

/**
 * Admin Service Auth Interface
 * Note: Token generation is handled by API Gateway, not Admin Service
 */
export interface IAdminAuthService {
  /**
   * Verify email/password credentials
   * Returns user data (Gateway generates tokens)
   */
  verifyCredentials(
    email: string,
    password: string,
  ): Promise<AdminAuthResponse>;

  /**
   * Validate refresh token hash and return user data
   * Gateway will verify JWT signature, then call this to validate stored hash
   */
  validateRefreshToken(
    adminId: string,
    provider: string,
    refreshTokenHash: string,
  ): Promise<AdminAuthResponse>;

  /**
   * Store tokens for an admin
   * Called by Gateway after generating new tokens
   */
  storeTokens(data: TokenStorageData): Promise<{ success: boolean }>;

  /**
   * Logout - clear tokens for a provider
   */
  logout(adminId: string, provider?: string): Promise<{ message: string }>;
}
