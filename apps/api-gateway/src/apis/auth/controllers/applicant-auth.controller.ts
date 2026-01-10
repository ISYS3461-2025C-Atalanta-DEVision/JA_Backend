import {
  Controller,
  Post,
  Body,
  HttpStatus,
  HttpException,
  Inject,
  Res,
  Req,
  Logger,
  Optional,
} from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from "@nestjs/swagger";
import { firstValueFrom, timeout, catchError } from "rxjs";
import { Response, Request } from "express";
import { Throttle } from "@nestjs/throttler";
import { CurrentUser, Public } from "@auth/decorators";
import { LoginDto, RegisterDto, FirebaseAuthDto } from "@auth/dto";
import { FirebaseService } from "@auth/firebase";
import { JweTokenService } from "@auth/services";
import { Role } from "@auth/enums";
import { createHash, randomUUID } from "crypto";
import { TokenRevocationService } from "@redis/services/token-revocation.service";
import { AuthenticatedUser } from "@auth/interfaces";
import { ChangePasswordDto } from "../dtos/requests/changePassword.dto";

/**
 * Gateway Auth Controller
 * Handles all applicant authentication requests
 *
 * Flow:
 * 1. Receive auth request from client
 * 2. Forward to Applicant Service for data operations
 * 3. Generate JWT tokens in Gateway
 * 4. Store tokens in Applicant Service (oauth_accounts)
 * 5. Return tokens to client
 */
@ApiTags("Applicant Auth")
@Controller("auth/applicant")
export class ApplicantAuthController {
  private readonly logger = new Logger(ApplicantAuthController.name);
  private readonly ACCESS_TOKEN_EXPIRY_MS = 30 * 60 * 1000; // 30 minutes
  private readonly REFRESH_TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

  constructor(
    @Inject("APPLICANT_SERVICE") private readonly applicantClient: ClientProxy,
    private readonly firebaseService: FirebaseService,
    private readonly jweTokenService: JweTokenService,
    @Optional()
    private readonly tokenRevocationService?: TokenRevocationService,
  ) { }

  /**
   * Hash refresh token for storage
   * Using SHA-256 for consistent hashing
   */
  private hashRefreshToken(token: string): string {
    return createHash("sha256").update(token).digest("hex");
  }

  /**
   * Generate JWE tokens and store in oauth_accounts
   * Uses A256GCM encryption for enhanced security
   */
  private async generateAndStoreTokens(
    user: {
      id: string;
      email: string;
      name: string;
      role: Role;
      country?: string;
      emailVerified?: boolean;
    },
    provider: string,
  ) {
    // Generate JWE encrypted tokens in Gateway
    const tokens = await this.jweTokenService.generateTokens(
      user.id,
      user.email,
      user.role,
      user.country,
      user.emailVerified,
    );

    // Calculate expiration dates
    const now = new Date();
    const accessTokenExp = new Date(
      now.getTime() + this.ACCESS_TOKEN_EXPIRY_MS,
    );
    const refreshTokenExp = new Date(
      now.getTime() + this.REFRESH_TOKEN_EXPIRY_MS,
    );

    // Hash refresh token for storage
    const refreshTokenHash = this.hashRefreshToken(tokens.refreshToken);

    // Register token in Redis for revocation tracking (if available)
    const jti = randomUUID();
    if (this.tokenRevocationService) {
      await this.tokenRevocationService.registerToken(jti, user.id);
    }

    // Store tokens in Applicant Service (oauth_accounts)
    await firstValueFrom(
      this.applicantClient
        .send(
          { cmd: "applicant.auth.storeTokens" },
          {
            applicantId: user.id,
            provider,
            accessToken: tokens.accessToken,
            accessTokenExp,
            refreshTokenHash,
            refreshTokenExp,
          },
        )
        .pipe(timeout(5000)),
    );

    this.logger.debug(`JWE tokens generated for user ${user.id}`);

    return tokens;
  }

  /**
   * Set auth cookies
   * - Local (HTTP, same-site): sameSite='lax', secure=false
   * - Production (HTTPS, cross-site): sameSite='none', secure=true
   */
  private setAuthCookies(
    res: Response,
    accessToken: string,
    refreshToken: string,
  ) {
    const isProduction = process.env.NODE_ENV === "production";

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      maxAge: 30 * 60 * 1000, // 30 minutes
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
  }

  @Post("register")
  @Public()
  @Throttle({ default: { limit: 5, ttl: 900000 } })
  @ApiOperation({
    summary: "Register new applicant",
    description: "Create a new applicant account with email/password",
  })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({
    status: 201,
    description: "Registration successful, tokens set in cookies",
  })
  @ApiResponse({ status: 400, description: "Invalid input data" })
  @ApiResponse({ status: 409, description: "Email already exists" })
  @ApiResponse({ status: 500, description: "Internal server error" })
  async register(
    @Body() registerDto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      // 1. Register applicant in Applicant Service (returns user data only)
      const result = await firstValueFrom(
        this.applicantClient
          .send({ cmd: "applicant.auth.register" }, registerDto)
          .pipe(
            timeout(5000),
            catchError((error) => {
              if (error?.message === "Email already registered") {
                throw new HttpException(
                  "Email already registered",
                  HttpStatus.CONFLICT,
                );
              }
              throw new HttpException(
                "Applicant service unavailable",
                HttpStatus.SERVICE_UNAVAILABLE,
              );
            }),
          ),
      );

      // 2. Generate tokens in Gateway (using provider from result)
      const tokens = await this.generateAndStoreTokens(
        result.user,
        result.provider,
      );

      // 3. Set cookies
      this.setAuthCookies(res, tokens.accessToken, tokens.refreshToken);

      return { user: result.user };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error.message || "Failed to register",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post("login")
  @Public()
  @Throttle({ default: { limit: 5, ttl: 900000 } })
  @ApiOperation({
    summary: "Login applicant",
    description: "Authenticate applicant with email/password",
  })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: "Login successful, tokens set in cookies",
  })
  @ApiResponse({ status: 401, description: "Invalid credentials" })
  @ApiResponse({ status: 500, description: "Internal server error" })
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      // 1. Verify credentials in Applicant Service (returns user data only)
      const result = await firstValueFrom(
        this.applicantClient
          .send({ cmd: "applicant.auth.verify" }, loginDto)
          .pipe(
            timeout(5000),
            catchError((error) => {
              throw new HttpException(
                error.message || "Applicant service unavailable",
                error.status || HttpStatus.INTERNAL_SERVER_ERROR,
              );
            }),
          ),
      );

      // 2. Generate tokens in Gateway (using provider from result)
      const tokens = await this.generateAndStoreTokens(
        result.user,
        result.provider,
      );

      // 3. Set cookies
      this.setAuthCookies(res, tokens.accessToken, tokens.refreshToken);

      return { user: result.user };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error.message || "Failed to login",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('change-password')
  @Throttle({ default: { limit: 3, ttl: 900000 } })
  @ApiOperation({
    summary: 'Change applicant password',
    description: 'Change password using current password. Invalidates all sessions.',
  })
  @ApiBody({ type: ChangePasswordDto })
  @ApiResponse({
    status: 200,
    description: 'Password changed successfully',
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 400, description: 'OAuth-only account' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async changePassword(
    @CurrentUser() user: AuthenticatedUser,
    @Body() data: ChangePasswordDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      await firstValueFrom(
        this.applicantClient
          .send(
            { cmd: 'applicant.auth.changePassword' },
            {
              applicantId: user.id,
              changePasswordDto: data
            },
          )
          .pipe(
            timeout(5000),
            catchError((error) => {
              throw new HttpException(
                error.message || 'Applicant service unavailable',
                error.status || HttpStatus.INTERNAL_SERVER_ERROR,
              );
            }),
          ),
      );

      // Clear auth cookies after password change
      res.clearCookie('accessToken')
      res.clearCookie('refreshToken')

      return { message: 'Password changed successfully' };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        error.message || 'Failed to change password',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post("refresh")
  @Public()
  @ApiOperation({
    summary: "Refresh tokens",
    description:
      "Get new access/refresh tokens using refresh token from cookie",
  })
  @ApiResponse({ status: 200, description: "Tokens refreshed successfully" })
  @ApiResponse({ status: 401, description: "Invalid or expired refresh token" })
  @ApiResponse({ status: 500, description: "Internal server error" })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      const refreshToken = req.cookies?.refreshToken;
      if (!refreshToken) {
        throw new HttpException(
          "Refresh token not found",
          HttpStatus.UNAUTHORIZED,
        );
      }

      // 1. Verify and decrypt JWE refresh token in Gateway
      const payload =
        await this.jweTokenService.verifyRefreshToken(refreshToken);

      // Get provider from JWT payload or default to 'email'
      const provider = (payload as any).provider || "email";

      // 2. Validate stored hash in Applicant Service
      const refreshTokenHash = this.hashRefreshToken(refreshToken);
      const result = await firstValueFrom(
        this.applicantClient
          .send(
            { cmd: "applicant.auth.validateRefresh" },
            { applicantId: payload.sub, provider, refreshTokenHash },
          )
          .pipe(
            timeout(5000),
            catchError((error) => {
              throw new HttpException(
                error.message || "Invalid refresh token",
                error.status || HttpStatus.UNAUTHORIZED,
              );
            }),
          ),
      );

      // 3. Generate new JWE tokens in Gateway (using provider from result)
      const tokens = await this.generateAndStoreTokens(
        result.user,
        result.provider,
      );

      // 4. Set cookies
      this.setAuthCookies(res, tokens.accessToken, tokens.refreshToken);

      return { user: result.user };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error.message || "Failed to refresh token",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Firebase Google Authentication
   * Frontend sends Firebase ID token, Gateway verifies and generates JWT
   */
  @Post("firebase/google")
  @Public()
  @Throttle({ default: { limit: 10, ttl: 900000 } })
  @ApiOperation({
    summary: "Firebase Google login",
    description: "Authenticate with Firebase Google ID token",
  })
  @ApiBody({ type: FirebaseAuthDto })
  @ApiResponse({
    status: 200,
    description: "Authentication successful, tokens set in cookies",
  })
  @ApiResponse({ status: 401, description: "Invalid Firebase token" })
  @ApiResponse({ status: 500, description: "Internal server error" })
  async firebaseGoogleLogin(
    @Body() dto: FirebaseAuthDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      // 1. Verify Firebase ID token in Gateway
      const firebaseUser = await this.firebaseService.verifyIdToken(
        dto.idToken,
      );

      Logger.debug(`firebaseUser`, firebaseUser);
      // 2. Find or create applicant in Applicant Service
      const result = await firstValueFrom(
        this.applicantClient
          .send(
            { cmd: "applicant.auth.firebase" },
            {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              name: firebaseUser.name,
              picture: firebaseUser.picture,
            },
          )
          .pipe(
            timeout(5000),
            catchError((error) => {
              throw new HttpException(
                error.message || "Applicant service unavailable",
                error.status || HttpStatus.INTERNAL_SERVER_ERROR,
              );
            }),
          ),
      );

      // 3. Generate tokens in Gateway (using provider from result - 'google')
      const tokens = await this.generateAndStoreTokens(
        result.user,
        result.provider,
      );

      // 4. Set cookies
      this.setAuthCookies(res, tokens.accessToken, tokens.refreshToken);

      return { user: result.user };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        "Firebase authentication failed",
        HttpStatus.UNAUTHORIZED,
      );
    }
  }

  @Post("logout")
  @ApiOperation({
    summary: "Logout applicant",
    description: "Revoke tokens and clear auth cookies",
  })
  @ApiResponse({ status: 200, description: "Logout successful" })
  @ApiResponse({ status: 500, description: "Internal server error" })
  async logout(@Req() req: any, @Res({ passthrough: true }) res: Response) {
    try {
      const applicantId = req.user?.id;
      if (applicantId) {
        // Revoke all tokens in Redis (if available)
        if (this.tokenRevocationService) {
          await this.tokenRevocationService.revokeAllUserTokens(applicantId);
          this.logger.debug(`All tokens revoked for user ${applicantId}`);
        }

        // Clear tokens in Applicant Service
        await firstValueFrom(
          this.applicantClient
            .send({ cmd: "applicant.auth.logout" }, { applicantId })
            .pipe(timeout(5000)),
        );
      }

      res.clearCookie("accessToken");
      res.clearCookie("refreshToken");

      return { message: "Logged out successfully" };
    } catch (error) {
      // Even if logout fails on backend, clear cookies
      res.clearCookie("accessToken");
      res.clearCookie("refreshToken");
      return { message: "Logged out successfully" };
    }
  }
}
