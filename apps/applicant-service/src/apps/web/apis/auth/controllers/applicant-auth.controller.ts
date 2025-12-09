import { Controller, Inject } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { APPLICANT_AUTH_SERVICE_WEB_PROVIDER } from '../../../constants';
import {
  IApplicantAuthService,
  TokenStorageData,
  RegisterData,
} from '../../../interfaces';

@Controller()
export class ApplicantAuthController {
  constructor(
    @Inject(APPLICANT_AUTH_SERVICE_WEB_PROVIDER)
    private readonly authService: IApplicantAuthService,
  ) {}

  /**
   * Register new applicant with email/password
   * Returns user data (Gateway generates tokens)
   */
  @MessagePattern({ cmd: 'applicant.auth.register' })
  async register(@Payload() data: RegisterData) {
    return await this.authService.register(data);
  }

  /**
   * Verify email/password credentials
   * Returns user data (Gateway generates tokens)
   */
  @MessagePattern({ cmd: 'applicant.auth.verify' })
  async verifyCredentials(
    @Payload() data: { email: string; password: string },
  ) {
    return await this.authService.verifyCredentials(data.email, data.password);
  }

  /**
   * Find or create OAuth applicant
   * Used by Gateway after verifying Firebase token
   */
  @MessagePattern({ cmd: 'applicant.auth.oauth' })
  async findOrCreateOAuthApplicant(
    @Payload() data: {
      provider: string;
      providerId: string;
      email: string;
      name: string;
      picture?: string;
    },
  ) {
    return await this.authService.findOrCreateOAuthApplicant(
      data.provider,
      data.providerId,
      data.email,
      data.name,
      data.picture,
    );
  }

  /**
   * Firebase authentication handler
   * Receives verified Firebase user info from API Gateway
   */
  @MessagePattern({ cmd: 'applicant.auth.firebase' })
  async firebaseAuth(
    @Payload() data: {
      uid: string;
      email: string;
      name: string;
      picture?: string;
    },
  ) {
    return await this.authService.findOrCreateOAuthApplicant(
      'google',
      data.uid,
      data.email,
      data.name,
      data.picture,
    );
  }

  /**
   * Validate refresh token hash
   * Gateway calls this after verifying JWT signature
   */
  @MessagePattern({ cmd: 'applicant.auth.validateRefresh' })
  async validateRefreshToken(
    @Payload() data: { applicantId: string; provider: string; refreshTokenHash: string },
  ) {
    return await this.authService.validateRefreshToken(
      data.applicantId,
      data.provider,
      data.refreshTokenHash,
    );
  }

  /**
   * Store tokens
   * Called by Gateway after generating tokens
   */
  @MessagePattern({ cmd: 'applicant.auth.storeTokens' })
  async storeTokens(@Payload() data: TokenStorageData) {
    return await this.authService.storeTokens(data);
  }

  /**
   * Logout - clear tokens
   */
  @MessagePattern({ cmd: 'applicant.auth.logout' })
  async logout(@Payload() data: { applicantId: string; provider?: string }) {
    return await this.authService.logout(data.applicantId, data.provider);
  }
}
