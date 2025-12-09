import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload, AuthModuleOptions } from '../interfaces';
import { Role, TokenType } from '../enums';
import { AUTH_MODULE_OPTIONS, JWT_CONSTANTS } from '../constants';

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    @Inject(AUTH_MODULE_OPTIONS)
    private readonly options: AuthModuleOptions,
  ) {}

  /**
   * Generate access token (30min TTL)
   */
  generateAccessToken(userId: string, email: string, role: Role): string {
    const payload = {
      sub: userId,
      email,
      role,
      type: 'access',
    };

    return this.jwtService.sign(payload, {
      secret: this.options.jwtSecret,
      expiresIn: this.options.jwtExpiresIn || JWT_CONSTANTS.DEFAULT_ACCESS_TOKEN_EXPIRY,
    } as any);
  }

  /**
   * Generate refresh token (7 day TTL)
   */
  generateRefreshToken(userId: string, email: string, role: Role): string {
    const payload = {
      sub: userId,
      email,
      role,
      type: 'refresh',
    };

    return this.jwtService.sign(payload, {
      secret: this.options.jwtRefreshSecret,
      expiresIn: this.options.jwtRefreshExpiresIn || JWT_CONSTANTS.DEFAULT_REFRESH_TOKEN_EXPIRY,
    } as any);
  }

  /**
   * Generate both access and refresh tokens
   */
  generateTokens(userId: string, email: string, role: Role) {
    return {
      accessToken: this.generateAccessToken(userId, email, role),
      refreshToken: this.generateRefreshToken(userId, email, role),
    };
  }

  /**
   * Verify access token
   */
  verifyAccessToken(token: string): JwtPayload {
    try {
      const payload = this.jwtService.verify<JwtPayload>(token, {
        secret: this.options.jwtSecret,
      });

      if (payload.type !== 'access') {
        throw new UnauthorizedException('Invalid token type');
      }

      return payload;
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  /**
   * Verify refresh token
   */
  verifyRefreshToken(token: string): JwtPayload {
    try {
      const payload = this.jwtService.verify<JwtPayload>(token, {
        secret: this.options.jwtRefreshSecret,
      });

      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('Invalid token type');
      }

      return payload;
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  /**
   * Decode token without verification (for debugging)
   */
  decodeToken(token: string): JwtPayload | null {
    try {
      return this.jwtService.decode(token) as JwtPayload;
    } catch {
      return null;
    }
  }
}
