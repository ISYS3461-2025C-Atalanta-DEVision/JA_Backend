import {
  Injectable,
  UnauthorizedException,
  Logger,
  InternalServerErrorException,
} from "@nestjs/common";
import { verify } from "@node-rs/argon2";
import { Role } from "@auth/enums";
import {
  AdminApplicantRepository,
  AdminOAuthAccountRepository,
  AdminApplicant,
} from "../../../libs/dals/mongodb";
import {
  IAdminAuthService,
  AdminAuthResponse,
  TokenStorageData,
} from "../interfaces";

/**
 * Admin Auth Service
 * Handles admin authentication data operations
 * Note: JWT token generation is done by API Gateway, not here
 */
@Injectable()
export class AdminAuthService implements IAdminAuthService {
  private readonly logger = new Logger(AdminAuthService.name);

  // Brute force protection constants
  private readonly MAX_LOGIN_ATTEMPTS = 5;
  private readonly LOCK_DURATION_MS = 60 * 1000; // 60 seconds

  constructor(
    private readonly adminRepo: AdminApplicantRepository,
    private readonly oauthAccountRepo: AdminOAuthAccountRepository,
  ) {}

  /**
   * Verify email/password credentials
   * Returns user data for Gateway to generate tokens
   * Includes brute force protection (5 attempts → 60 sec lock)
   */
  async verifyCredentials(
    email: string,
    password: string,
  ): Promise<AdminAuthResponse> {
    const normalizedEmail = email.toLowerCase().trim();
    try {
      const admin = await this.adminRepo.findByEmail(normalizedEmail);
      if (!admin || !admin.isActive) {
        throw new UnauthorizedException("Invalid credentials");
      }

      // Check if account is locked (brute force protection)
      if (admin.lockUntil && admin.lockUntil > new Date()) {
        const remainingSeconds = Math.ceil(
          (admin.lockUntil.getTime() - Date.now()) / 1000,
        );
        throw new UnauthorizedException(
          `Account locked. Try again in ${remainingSeconds} seconds.`,
        );
      }

      if (!admin.passwordHash) {
        throw new UnauthorizedException("Invalid credentials");
      }

      const isPasswordValid = await verify(admin.passwordHash, password);
      if (!isPasswordValid) {
        // Increment login attempts
        const newAttempts = (admin.loginAttempts || 0) + 1;
        await this.adminRepo.incrementLoginAttempts(admin._id.toString());

        // Lock account if max attempts reached
        if (newAttempts >= this.MAX_LOGIN_ATTEMPTS) {
          const lockUntil = new Date(Date.now() + this.LOCK_DURATION_MS);
          await this.adminRepo.lockAccount(admin._id.toString(), lockUntil);
          this.logger.warn(
            `Account locked after ${newAttempts} failed attempts`,
          );
          throw new UnauthorizedException(
            `Account locked due to too many failed attempts. Try again in 60 seconds.`,
          );
        }

        throw new UnauthorizedException("Invalid credentials");
      }

      // Reset login attempts on successful login
      await this.adminRepo.resetLoginAttempts(admin._id.toString());

      // Update last login
      await this.adminRepo.updateLastLogin(admin._id.toString());

      return this.toAuthResponse(admin, "email");
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      this.logger.error(`Login failed`, error.stack);
      throw new InternalServerErrorException("Login failed");
    }
  }

  /**
   * Validate stored refresh token hash
   * Gateway calls this after verifying JWT signature
   */
  async validateRefreshToken(
    adminId: string,
    provider: string,
    refreshTokenHash: string,
  ): Promise<AdminAuthResponse> {
    try {
      const admin = await this.adminRepo.findById(adminId);
      if (!admin || !admin.isActive) {
        throw new UnauthorizedException("User not found or inactive");
      }

      // Get stored refresh token hash from oauth_accounts
      const storedHash = await this.oauthAccountRepo.getRefreshTokenHash(
        adminId,
        provider,
      );
      if (!storedHash) {
        throw new UnauthorizedException("No active session");
      }

      // Compare stored hash with provided hash
      if (storedHash !== refreshTokenHash) {
        throw new UnauthorizedException("Invalid refresh token");
      }

      return this.toAuthResponse(admin, provider);
    } catch (error) {
      this.logger.error(
        `Refresh token validation failed for ${adminId}`,
        error.stack,
      );
      if (error instanceof UnauthorizedException) throw error;
      throw new InternalServerErrorException("Token validation failed");
    }
  }

  /**
   * Store tokens
   * Called by Gateway after generating tokens
   */
  async storeTokens(data: TokenStorageData): Promise<{ success: boolean }> {
    try {
      await this.oauthAccountRepo.storeTokens(data.adminId, data.provider, {
        accessToken: data.accessToken,
        accessTokenExp: data.accessTokenExp,
        refreshTokenHash: data.refreshTokenHash,
        refreshTokenExp: data.refreshTokenExp,
      });
      return { success: true };
    } catch (error) {
      this.logger.error(`Store tokens failed for ${data.adminId}`, error.stack);
      throw new InternalServerErrorException("Failed to store tokens");
    }
  }

  /**
   * Logout - clear tokens
   * If provider specified, clear only that provider's tokens
   * Otherwise clear all tokens
   */
  async logout(
    adminId: string,
    provider?: string,
  ): Promise<{ message: string }> {
    try {
      if (provider) {
        await this.oauthAccountRepo.clearTokens(adminId, provider);
      } else {
        await this.oauthAccountRepo.clearAllTokens(adminId);
      }
      return { message: "Logged out successfully" };
    } catch (error) {
      this.logger.error(`Logout failed for ${adminId}`, error.stack);
      throw new InternalServerErrorException("Logout failed");
    }
  }

  /**
   * Convert admin to auth response
   */
  private toAuthResponse(
    admin: AdminApplicant,
    provider: string,
  ): AdminAuthResponse {
    return {
      user: {
        id: admin._id.toString(),
        email: admin.email,
        name: admin.name,
        role: Role.Admin,
        emailVerified: admin.emailVerified,
      },
      provider,
    };
  }
}
