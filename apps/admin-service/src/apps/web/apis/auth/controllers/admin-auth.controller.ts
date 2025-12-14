import { Controller, Inject, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ADMIN_AUTH_SERVICE_WEB_PROVIDER } from '../../../constants';
import { IAdminAuthService, TokenStorageData } from '../../../interfaces';

@Controller()
export class AdminAuthController {
  constructor(
    @Inject(ADMIN_AUTH_SERVICE_WEB_PROVIDER)
    private readonly authService: IAdminAuthService,
  ) { }

  /**
   * Verify email/password credentials
   * Returns user data (Gateway generates tokens)
   */
  @MessagePattern({ cmd: 'admin.auth.verify' })
  async verifyCredentials(
    @Payload() data: { email: string; password: string },
  ) {
    return await this.authService.verifyCredentials(data.email, data.password);
  }

  /**
   * Validate refresh token hash
   * Gateway calls this after verifying JWT signature
   */
  @MessagePattern({ cmd: 'admin.auth.validateRefresh' })
  async validateRefreshToken(
    @Payload()
    data: { adminId: string; provider: string; refreshTokenHash: string },
  ) {
    // Logger.debug("Payload: ", data)

    return await this.authService.validateRefreshToken(
      data.adminId,
      data.provider,
      data.refreshTokenHash,
    );
  }

  /**
   * Store tokens
   * Called by Gateway after generating tokens
   */
  @MessagePattern({ cmd: 'admin.auth.storeTokens' })
  async storeTokens(@Payload() data: TokenStorageData) {
    return await this.authService.storeTokens(data);
  }

  /**
   * Logout - clear tokens
   */
  @MessagePattern({ cmd: 'admin.auth.logout' })
  async logout(@Payload() data: { adminId: string; provider?: string }) {
    return await this.authService.logout(data.adminId, data.provider);
  }
}
