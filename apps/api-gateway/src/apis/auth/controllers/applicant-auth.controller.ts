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
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, timeout, catchError } from 'rxjs';
import { Response, Request } from 'express';
import { Throttle } from '@nestjs/throttler';
import { Public } from '@auth/decorators';
import { LoginDto, RegisterDto, FirebaseAuthDto } from '@auth/dto';
import { FirebaseService } from '@auth/firebase';
import { TokenService } from '@auth/services';
import { Role } from '@auth/enums';
import { createHash } from 'crypto';

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
@Controller('auth/applicant')
export class ApplicantAuthController {
  private readonly ACCESS_TOKEN_EXPIRY_MS = 30 * 60 * 1000; // 30 minutes
  private readonly REFRESH_TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

  constructor(
    @Inject('APPLICANT_SERVICE') private readonly applicantClient: ClientProxy,
    private readonly firebaseService: FirebaseService,
    private readonly tokenService: TokenService,
  ) { }

  /**
   * Hash refresh token for storage
   * Using SHA-256 for consistent hashing
   */
  private hashRefreshToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  /**
   * Generate tokens and store in oauth_accounts
   */
  private async generateAndStoreTokens(
    user: {
      id: string;
      email: string;
      name: string;
      role: Role;
    },
    provider: string,
  ) {
    // Generate tokens in Gateway
    const tokens = this.tokenService.generateTokens(user.id, user.email, user.role);

    // Calculate expiration dates
    const now = new Date();
    const accessTokenExp = new Date(now.getTime() + this.ACCESS_TOKEN_EXPIRY_MS);
    const refreshTokenExp = new Date(now.getTime() + this.REFRESH_TOKEN_EXPIRY_MS);

    // Hash refresh token for storage
    const refreshTokenHash = this.hashRefreshToken(tokens.refreshToken);
    Logger.debug('finish token', tokens)

    // Store tokens in Applicant Service (oauth_accounts)
    await firstValueFrom(
      this.applicantClient
        .send(
          { cmd: 'applicant.auth.storeTokens' },
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

    Logger.debug('finish token', tokens)

    return tokens;
  }

  /**
   * Set auth cookies
   */
  private setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 60 * 1000, // 30 minutes
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
  }

  @Post('register')
  @Public()
  @Throttle({ default: { limit: 5, ttl: 900000 } })
  async register(
    @Body() registerDto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      // 1. Register applicant in Applicant Service (returns user data only)
      const result = await firstValueFrom(
        this.applicantClient
          .send({ cmd: 'applicant.auth.register' }, registerDto)
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

      // 2. Generate tokens in Gateway (using provider from result)
      const tokens = await this.generateAndStoreTokens(result.user, result.provider);

      // 3. Set cookies
      this.setAuthCookies(res, tokens.accessToken, tokens.refreshToken);

      return { user: result.user };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error.message || 'Failed to register',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('login')
  @Public()
  @Throttle({ default: { limit: 5, ttl: 900000 } })
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      // 1. Verify credentials in Applicant Service (returns user data only)
      const result = await firstValueFrom(
        this.applicantClient
          .send({ cmd: 'applicant.auth.verify' }, loginDto)
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

      // 2. Generate tokens in Gateway (using provider from result)
      const tokens = await this.generateAndStoreTokens(result.user, result.provider);

      // 3. Set cookies
      this.setAuthCookies(res, tokens.accessToken, tokens.refreshToken);

      return { user: result.user };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error.message || 'Failed to login',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('refresh')
  @Public()
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      const refreshToken = req.cookies?.refreshToken;
      if (!refreshToken) {
        throw new HttpException('Refresh token not found', HttpStatus.UNAUTHORIZED);
      }

      // 1. Verify refresh token JWT signature in Gateway
      const payload = this.tokenService.verifyRefreshToken(refreshToken);

      // Get provider from JWT payload or default to 'email'
      const provider = (payload as any).provider || 'email';

      // 2. Validate stored hash in Applicant Service
      const refreshTokenHash = this.hashRefreshToken(refreshToken);
      const result = await firstValueFrom(
        this.applicantClient
          .send(
            { cmd: 'applicant.auth.validateRefresh' },
            { applicantId: payload.sub, provider, refreshTokenHash },
          )
          .pipe(
            timeout(5000),
            catchError((error) => {
              throw new HttpException(
                error.message || 'Invalid refresh token',
                error.status || HttpStatus.UNAUTHORIZED,
              );
            }),
          ),
      );

      // 3. Generate new tokens in Gateway (using provider from result)
      const tokens = await this.generateAndStoreTokens(result.user, result.provider);

      // 4. Set cookies
      this.setAuthCookies(res, tokens.accessToken, tokens.refreshToken);

      return { user: result.user };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error.message || 'Failed to refresh token',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Firebase Google Authentication
   * Frontend sends Firebase ID token, Gateway verifies and generates JWT
   */
  @Post('firebase/google')
  @Public()
  @Throttle({ default: { limit: 10, ttl: 900000 } })
  async firebaseGoogleLogin(
    @Body() dto: FirebaseAuthDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      // 1. Verify Firebase ID token in Gateway
      const firebaseUser = await this.firebaseService.verifyIdToken(dto.idToken);

      Logger.debug(`firebaseUser`, firebaseUser)
      // 2. Find or create applicant in Applicant Service
      const result = await firstValueFrom(
        this.applicantClient
          .send(
            { cmd: 'applicant.auth.firebase' },
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
                error.message || 'Applicant service unavailable',
                error.status || HttpStatus.INTERNAL_SERVER_ERROR,
              );
            }),
          ),
      );

      // 3. Generate tokens in Gateway (using provider from result - 'google')
      const tokens = await this.generateAndStoreTokens(result.user, result.provider);

      // 4. Set cookies
      this.setAuthCookies(res, tokens.accessToken, tokens.refreshToken);

      return { user: result.user };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Firebase authentication failed',
        HttpStatus.UNAUTHORIZED,
      );
    }
  }

  @Post('logout')
  async logout(
    @Req() req: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      const applicantId = req.user?.id;
      if (applicantId) {
        await firstValueFrom(
          this.applicantClient
            .send({ cmd: 'applicant.auth.logout' }, { applicantId })
            .pipe(timeout(5000)),
        );
      }

      res.clearCookie('accessToken');
      res.clearCookie('refreshToken');

      return { message: 'Logged out successfully' };
    } catch (error) {
      // Even if logout fails on backend, clear cookies
      res.clearCookie('accessToken');
      res.clearCookie('refreshToken');
      return { message: 'Logged out successfully' };
    }
  }
}
