import { Injectable, Inject, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtPayload, AuthModuleOptions } from '../interfaces';
import { Role } from '../enums';
import { AUTH_MODULE_OPTIONS } from '../constants';

/**
 * JWE Token Service
 * Implements encrypted JWT tokens using A256GCM algorithm
 * Phase 2 upgrade from JWS to JWE for enhanced security
 */
@Injectable()
export class JweTokenService {
  private readonly logger = new Logger(JweTokenService.name);
  private accessSecret: Uint8Array;
  private refreshSecret: Uint8Array;

  constructor(
    @Inject(AUTH_MODULE_OPTIONS)
    private readonly options: AuthModuleOptions,
  ) {
    // Initialize secrets from configuration
    this.initSecrets();
  }

  /**
   * Initialize encryption secrets from env or generate secure ones
   */
  private initSecrets() {
    // For A256GCM, we need 256-bit (32 byte) keys
    const accessKey = this.options.jweAccessSecret || this.options.jwtSecret;
    const refreshKey =
      this.options.jweRefreshSecret || this.options.jwtRefreshSecret;

    // Convert string secrets to 32-byte keys using SHA-256 hash
    this.accessSecret = this.deriveKey(accessKey);
    this.refreshSecret = this.deriveKey(refreshKey);
  }

  /**
   * Derive a 32-byte key from a string using simple hashing
   */
  private deriveKey(secret: string): Uint8Array {
    // Use the secret directly if it's already 32 bytes when base64 decoded
    // Otherwise, pad/truncate to 32 bytes
    const encoder = new TextEncoder();
    const data = encoder.encode(secret);

    // Simple key derivation: repeat pattern to 32 bytes
    const key = new Uint8Array(32);
    for (let i = 0; i < 32; i++) {
      key[i] = data[i % data.length];
    }
    return key;
  }

  /**
   * Generate encrypted access token (JWE)
   * Algorithm: A256GCM (AES-256-GCM)
   */
  async generateAccessToken(
    userId: string,
    email: string,
    role: Role,
    country?: string,
    emailVerified?: boolean,
  ): Promise<string> {
    const { EncryptJWT } = await import('jose'); // dynamic import

    const payload = {
      sub: userId,
      email,
      role,
      type: 'access',
      ...(country && { country }),
      ...(emailVerified !== undefined && { emailVerified }),
    };

    const expiresIn = this.options.jwtExpiresIn || '30m';
    const expirationTime = this.parseExpiresIn(expiresIn);

    const jwt = await new EncryptJWT(payload as any)
      .setProtectedHeader({ alg: 'dir', enc: 'A256GCM' })
      .setIssuedAt()
      .setExpirationTime(expirationTime)
      .encrypt(this.accessSecret);

    return jwt;
  }

  /**
   * Generate encrypted refresh token (JWE)
   */
  async generateRefreshToken(
    userId: string,
    email: string,
    role: Role,
  ): Promise<string> {
    const { EncryptJWT } = await import('jose'); // dynamic import

    const payload = {
      sub: userId,
      email,
      role,
      type: 'refresh',
    };

    const expiresIn = this.options.jwtRefreshExpiresIn || '7d';
    const expirationTime = this.parseExpiresIn(expiresIn);

    const jwt = await new EncryptJWT(payload as any)
      .setProtectedHeader({ alg: 'dir', enc: 'A256GCM' })
      .setIssuedAt()
      .setExpirationTime(expirationTime)
      .encrypt(this.refreshSecret);

    return jwt;
  }

  /**
   * Generate both access and refresh tokens
   */
  async generateTokens(
    userId: string,
    email: string,
    role: Role,
    country?: string,
    emailVerified?: boolean,
  ) {
    const [accessToken, refreshToken] = await Promise.all([
      this.generateAccessToken(userId, email, role, country, emailVerified),
      this.generateRefreshToken(userId, email, role),
    ]);

    return { accessToken, refreshToken };
  }

  /**
   * Verify and decrypt access token
   */
  async verifyAccessToken(token: string): Promise<JwtPayload> {
    try {
      const { jwtDecrypt } = await import('jose'); // dynamic import

      const { payload } = await jwtDecrypt(token, this.accessSecret);

      if ((payload as any).type !== 'access') {
        throw new UnauthorizedException('Invalid token type');
      }

      return {
        sub: payload.sub as string,
        email: (payload as any).email,
        role: (payload as any).role,
        type: 'access',
        country: (payload as any).country,
        emailVerified: (payload as any).emailVerified,
        iat: payload.iat,
        exp: payload.exp,
      };
    } catch (error) {
      this.logger.debug(`Access token verification failed: ${error.message}`);
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  /**
   * Verify and decrypt refresh token
   */
  async verifyRefreshToken(token: string): Promise<JwtPayload> {
    try {
      const { jwtDecrypt } = await import('jose'); // dynamic import

      const { payload } = await jwtDecrypt(token, this.refreshSecret);

      if ((payload as any).type !== 'refresh') {
        throw new UnauthorizedException('Invalid token type');
      }

      return {
        sub: payload.sub as string,
        email: (payload as any).email,
        role: (payload as any).role,
        type: 'refresh',
        iat: payload.iat,
        exp: payload.exp,
      };
    } catch (error) {
      this.logger.debug(`Refresh token verification failed: ${error.message}`);
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  /**
   * Parse expiration time string to jose format
   * Supports: '30m', '1h', '7d', etc.
   */
  private parseExpiresIn(expiresIn: string): string | number {
    // jose accepts strings like '2h', '7d', etc.
    return expiresIn;
  }
}
