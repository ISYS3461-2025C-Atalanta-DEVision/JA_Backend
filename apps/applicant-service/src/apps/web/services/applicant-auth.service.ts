import { Injectable, UnauthorizedException, ConflictException, Logger, InternalServerErrorException } from '@nestjs/common';
import { hash, verify } from '@node-rs/argon2';
import { Role } from '@auth/enums';
import { ApplicantRepository, OAuthAccountRepository, Applicant, OAuthAccount } from '../../../libs/dals/mongodb';
import { IApplicantAuthService, ApplicantAuthResponse, TokenStorageData } from '../interfaces';

/**
 * Applicant Auth Service
 * Handles applicant authentication data operations
 * Note: JWT token generation is done by API Gateway, not here
 */
@Injectable()
export class ApplicantAuthService implements IApplicantAuthService {
  private readonly logger = new Logger(ApplicantAuthService.name);

  constructor(
    private readonly applicantRepo: ApplicantRepository,
    private readonly oauthAccountRepo: OAuthAccountRepository,
  ) { }

  /**
   * Register new applicant with email/password
   * Returns user data for Gateway to generate tokens
   */
  async register(name: string, email: string, password: string): Promise<ApplicantAuthResponse> {
    try {
      const existingApplicant = await this.applicantRepo.findByEmail(email);
      if (existingApplicant) {
        throw new ConflictException('Email already registered');
      }

      const passwordHash = await hash(password, {
        memoryCost: 65536,
        timeCost: 3,
        parallelism: 4,
        outputLen: 32,
      });

      const applicant = await this.applicantRepo.create({
        name,
        email,
        passwordHash,
        isActive: true,
      });

      // Create email provider oauth account for token storage
      await this.oauthAccountRepo.create({
        applicantId: applicant._id.toString(),
        provider: 'email',
        providerId: email,
        email,
        name,
      });

      return this.toAuthResponse(applicant, 'email');
    } catch (error) {
      this.logger.error(`Register failed for ${email}`, error.stack);
      if (error instanceof ConflictException) throw error;
      if (error.code === 11000) throw new ConflictException('Email already registered');
      throw new InternalServerErrorException('Registration failed');
    }
  }

  /**
   * Verify email/password credentials
   * Returns user data for Gateway to generate tokens
   */
  async verifyCredentials(email: string, password: string): Promise<ApplicantAuthResponse> {
    try {
      const applicant = await this.applicantRepo.findByEmail(email);
      if (!applicant || !applicant.isActive) {
        throw new UnauthorizedException('Invalid credentials');
      }

      if (!applicant.passwordHash) {
        throw new UnauthorizedException('Please use OAuth login (Google)');
      }

      const isPasswordValid = await verify(applicant.passwordHash, password);
      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid credentials');
      }

      // Update last login
      await this.applicantRepo.updateLastLogin(applicant._id.toString());

      return this.toAuthResponse(applicant, 'email');
    } catch (error) {
      this.logger.error(`Login failed for ${email}`, error.stack);
      if (error instanceof UnauthorizedException) throw error;
      throw new InternalServerErrorException('Login failed');
    }
  }

  /**
   * Find or create applicant for OAuth login
   * Lookup priority: email first (stable), then sync providerId (Firebase UID)
   */
  async findOrCreateOAuthApplicant(
    provider: string,
    providerId: string,
    email: string,
    name: string,
    picture?: string,
  ): Promise<ApplicantAuthResponse> {
    try {
      // 1. Find applicant by email first (email is stable identifier)
      let applicant = await this.applicantRepo.findByEmail(email);
      let oauthAccount: OAuthAccount | null = null;

      if (applicant) {
        if (!applicant.isActive) {
          throw new UnauthorizedException('User account is inactive');
        }

        // 2. Find existing oauth account for this applicant+provider
        oauthAccount = await this.oauthAccountRepo.findByApplicantIdAndProvider(
          applicant._id.toString(),
          provider,
        );

        if (oauthAccount) {
          // Update providerId if changed (Firebase UID sync)
          const updates: Partial<OAuthAccount> = {};
          if (oauthAccount.providerId !== providerId) {
            updates.providerId = providerId;
          }
          if (oauthAccount.name !== name) {
            updates.name = name;
          }
          if (oauthAccount.picture !== picture) {
            updates.picture = picture;
          }

          if (Object.keys(updates).length > 0) {
            await this.oauthAccountRepo.updateByApplicantAndProvider(
              applicant._id.toString(),
              provider,
              updates,
            );
          }
        } else {
          // Create oauth account for existing applicant
          oauthAccount = await this.oauthAccountRepo.create({
            applicantId: applicant._id.toString(),
            provider,
            providerId,
            email,
            name,
            picture,
          });
        }
      } else {
        // 3. New user - create applicant + oauth account
        applicant = await this.applicantRepo.create({
          name,
          email,
          isActive: true,
        });

        oauthAccount = await this.oauthAccountRepo.create({
          applicantId: applicant._id.toString(),
          provider,
          providerId,
          email,
          name,
          picture,
        });
      }

      // Update last login
      await this.applicantRepo.updateLastLogin(applicant._id.toString());

      return this.toAuthResponse(applicant, provider);
    } catch (error) {
      this.logger.error(`OAuth login failed for ${email}`, error.stack);

      // Re-throw known exceptions
      if (error instanceof UnauthorizedException || error instanceof ConflictException) {
        throw error;
      }

      // Handle duplicate key error (unique index violation)
      if (error.code === 11000) {
        this.logger.warn(`Duplicate oauth account attempt: ${email}, ${provider}`);
        throw new ConflictException('OAuth account already exists');
      }

      throw new InternalServerErrorException('Authentication failed');
    }
  }

  /**
   * Validate stored refresh token hash
   * Gateway calls this after verifying JWT signature
   */
  async validateRefreshToken(
    applicantId: string,
    provider: string,
    refreshTokenHash: string,
  ): Promise<ApplicantAuthResponse> {
    try {
      const applicant = await this.applicantRepo.findById(applicantId);
      if (!applicant || !applicant.isActive) {
        throw new UnauthorizedException('User not found or inactive');
      }

      // Get stored refresh token hash from oauth_accounts
      const storedHash = await this.oauthAccountRepo.getRefreshTokenHash(applicantId, provider);
      if (!storedHash) {
        throw new UnauthorizedException('No active session');
      }

      // Compare stored hash with provided hash
      if (storedHash !== refreshTokenHash) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      return this.toAuthResponse(applicant, provider);
    } catch (error) {
      this.logger.error(`Refresh token validation failed for ${applicantId}`, error.stack);
      if (error instanceof UnauthorizedException) throw error;
      throw new InternalServerErrorException('Token validation failed');
    }
  }

  /**
   * Store tokens
   * Called by Gateway after generating tokens
   */
  async storeTokens(data: TokenStorageData): Promise<{ success: boolean }> {
    try {
      await this.oauthAccountRepo.storeTokens(data.applicantId, data.provider, {
        accessToken: data.accessToken,
        accessTokenExp: data.accessTokenExp,
        refreshTokenHash: data.refreshTokenHash,
        refreshTokenExp: data.refreshTokenExp,
      });
      return { success: true };
    } catch (error) {
      this.logger.error(`Store tokens failed for ${data.applicantId}`, error.stack);
      throw new InternalServerErrorException('Failed to store tokens');
    }
  }

  /**
   * Logout - clear tokens
   * If provider specified, clear only that provider's tokens
   * Otherwise clear all tokens
   */
  async logout(applicantId: string, provider?: string): Promise<{ message: string }> {
    try {
      if (provider) {
        await this.oauthAccountRepo.clearTokens(applicantId, provider);
      } else {
        await this.oauthAccountRepo.clearAllTokens(applicantId);
      }
      return { message: 'Logged out successfully' };
    } catch (error) {
      this.logger.error(`Logout failed for ${applicantId}`, error.stack);
      throw new InternalServerErrorException('Logout failed');
    }
  }

  /**
   * Convert applicant to auth response
   */
  private toAuthResponse(applicant: Applicant, provider: string): ApplicantAuthResponse {
    return {
      user: {
        id: applicant._id.toString(),
        email: applicant.email,
        name: applicant.name,
        role: Role.Applicant,
      },
      provider,
    };
  }
}
