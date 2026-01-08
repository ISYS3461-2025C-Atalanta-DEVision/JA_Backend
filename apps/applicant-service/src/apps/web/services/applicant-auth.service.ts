import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  Logger,
  InternalServerErrorException,
  NotFoundException,
  HttpStatus,
} from '@nestjs/common';
import { hash, verify } from '@node-rs/argon2';
import { Role } from '@auth/enums';
import {
  ApplicantRepository,
  OAuthAccountRepository,
  Applicant,
  OAuthAccount,
} from '../../../libs/dals/mongodb';
import {
  IApplicantAuthService,
  ApplicantAuthResponse,
  TokenStorageData,
  RegisterData,
} from '../interfaces';
import { isValidCountryCode } from '@common/constants/countries';
import { generateEmailVerificationToken } from '@auth/services';
import { AddEmailHashDto } from '../apis/applicant/dtos/requests/add-email-verification-hash';
import { MailerService } from '@libs/mailer';
import { RpcException } from '@nestjs/microservices';

/**
 * Applicant Auth Service
 * Handles applicant authentication data operations
 * Note: JWT token generation is done by API Gateway, not here
 */
@Injectable()
export class ApplicantAuthService implements IApplicantAuthService {
  private readonly logger = new Logger(ApplicantAuthService.name);

  constructor(
    private readonly mailerService: MailerService,
    private readonly applicantRepo: ApplicantRepository,
    private readonly oauthAccountRepo: OAuthAccountRepository,
  ) { }

  /**
   * Register new applicant with email/password
   * Returns user data for Gateway to generate tokens
   */
  async register(data: RegisterData): Promise<ApplicantAuthResponse> {
    const { name, email, password, country, phone, street, city } = data;

    try {
      if (!isValidCountryCode(country)) {
        throw new RpcException({
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Invalid country code',
        });
      }

      const existingApplicant = await this.applicantRepo.findByEmail(email);
      if (existingApplicant) {
        throw new RpcException({
          statusCode: HttpStatus.CONFLICT,
          message: 'Email already registered',
        });
      }

      const passwordHash = await hash(password, {
        memoryCost: 19456,
        timeCost: 2,
        parallelism: 1,
        outputLen: 32,
      });

      const applicant = await this.applicantRepo.create({
        name,
        email: email.toLowerCase(),
        country: country.toUpperCase(),
        phone,
        street,
        city,
        passwordHash,
        emailVerified: false,
        isActive: true,
      });

      await this.sendVerificationEmail(applicant._id.toString());

      await this.oauthAccountRepo.create({
        applicantId: applicant._id.toString(),
        provider: 'email',
        providerId: email.toLowerCase(),
        email: email.toLowerCase(),
        name,
      });

      return this.toAuthResponse(applicant, 'email');
    } catch (error) {
      this.logger.error(`Register failed for ${email}`, error.stack);

      if (error instanceof RpcException) {
        throw error;
      }

      if (error?.code === 11000) {
        throw new RpcException({
          statusCode: HttpStatus.CONFLICT,
          message: 'Email already registered',
        });
      }

      throw new RpcException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Registration failed',
      });
    }
  }

  // Brute force protection constants
  private readonly MAX_LOGIN_ATTEMPTS = 5;
  private readonly LOCK_DURATION_MS = 60 * 1000; // 60 seconds

  /**
   * Verify email/password credentials
   * Returns user data for Gateway to generate tokens
   * Includes brute force protection (5 attempts → 60 sec lock)
   */
  async verifyCredentials(
    email: string,
    password: string,
  ): Promise<ApplicantAuthResponse> {
    try {
      const applicant = await this.applicantRepo.findByEmail(email);

      if (!applicant || !applicant.isActive) {
        throw new RpcException({
          statusCode: HttpStatus.UNAUTHORIZED,
          message: 'Invalid credentials, please check your email and/or password',
        });
      }

      // Brute-force lock check
      if (applicant.lockUntil && applicant.lockUntil > new Date()) {
        const remainingSeconds = Math.ceil(
          (applicant.lockUntil.getTime() - Date.now()) / 1000,
        );

        throw new RpcException({
          statusCode: HttpStatus.UNAUTHORIZED,
          message: `Account locked. Try again in ${remainingSeconds} seconds.`,
        });
      }

      if (!applicant.passwordHash) {
        throw new RpcException({
          statusCode: HttpStatus.UNAUTHORIZED,
          message: 'Please use OAuth login (Google)',
        });
      }

      const isPasswordValid = await verify(applicant.passwordHash, password);

      if (!isPasswordValid) {
        const newAttempts = (applicant.loginAttempts || 0) + 1;
        await this.applicantRepo.incrementLoginAttempts(applicant._id.toString());

        if (newAttempts >= this.MAX_LOGIN_ATTEMPTS) {
          const lockUntil = new Date(Date.now() + this.LOCK_DURATION_MS);
          await this.applicantRepo.lockAccount(
            applicant._id.toString(),
            lockUntil,
          );

          this.logger.warn(
            `Account locked for ${email} after ${newAttempts} failed attempts`,
          );

          throw new RpcException({
            statusCode: HttpStatus.UNAUTHORIZED,
            message:
              'Account locked due to too many failed attempts. Try again in 60 seconds.',
          });
        }

        throw new RpcException({
          statusCode: HttpStatus.UNAUTHORIZED,
          message: 'Invalid credentials, please check your email and/or password',
        });
      }

      // Successful login
      await this.applicantRepo.resetLoginAttempts(applicant._id.toString());
      await this.applicantRepo.updateLastLogin(applicant._id.toString());

      return this.toAuthResponse(applicant, 'email');
    } catch (error) {
      this.logger.error(`Login failed for ${email}`, error.stack);

      if (error instanceof RpcException) {
        throw error;
      }

      throw new RpcException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Login failed',
      });
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
        // SSO users have email verified by provider
        applicant = await this.applicantRepo.create({
          name,
          email: email.toLowerCase(),
          country: 'VN', // Default country for SSO users, can be updated later
          emailVerified: provider === 'google', // Google verifies email
          isActive: true,
        });

        oauthAccount = await this.oauthAccountRepo.create({
          applicantId: applicant._id.toString(),
          provider,
          providerId,
          email: email.toLowerCase(),
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

  private async sendVerificationEmail(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const applicant = await this.applicantRepo.findById(id);
      if (!applicant) {
        throw new NotFoundException(`Applicant with ID ${id} not found`);
      }

      const { rawToken, hashedToken, expires } =
        generateEmailVerificationToken();

      await this.mailerService.sendEmailVerification(
        applicant.email,
        rawToken,
      );

      applicant.emailVerificationToken = hashedToken;
      applicant.emailVerificationTokenExpires = expires;

      const updateDto: AddEmailHashDto = {
        emailVerificationToken: hashedToken,
        emailVerificationTokenExpires: expires
      }

      await this.applicantRepo.update(id, updateDto);

      return {
        success: true,
        message: `Email successfully sent to ${applicant.email}`
      }
    } catch (error) {
      this.logger.error(`Cannot activate applicant email failed for ${id}`, error.stack);
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Failed to activate email');
    }
  }


  /**
   * Convert applicant to auth response
   */
  private toAuthResponse(
    applicant: Applicant,
    provider: string,
  ): ApplicantAuthResponse {
    return {
      user: {
        id: applicant._id.toString(),
        email: applicant.email,
        name: applicant.name,
        role: Role.Applicant,
        country: applicant.country,
        emailVerified: applicant.emailVerified,
      },
      provider,
    };
  }
}
