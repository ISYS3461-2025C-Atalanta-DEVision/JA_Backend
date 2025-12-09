import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
  CanActivate,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { timingSafeEqual } from 'crypto';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { JweTokenService } from '../services/jwe-token.service';

/**
 * Guard that allows authentication via JWE OR API Key.
 * - If X-API-Key header is present and valid, allows access (no user context)
 * - If JWE (Bearer token or cookie) is valid, allows access (user context available)
 * - Rejects if neither auth method succeeds
 *
 * Use @ApiKeyAuth() decorator to apply this guard to endpoints.
 */
@Injectable()
export class ApiKeyOrJweGuard implements CanActivate {
  private readonly logger = new Logger(ApiKeyOrJweGuard.name);
  private readonly validApiKey: string | undefined;

  constructor(
    private readonly reflector: Reflector,
    private readonly configService: ConfigService,
    private readonly jweTokenService: JweTokenService,
  ) {
    this.validApiKey = this.configService.get<string>('API_KEY');
  }

  /**
   * Timing-safe string comparison to prevent timing attacks.
   */
  private timingSafeCompare(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }

    try {
      const bufA = Buffer.from(a, 'utf-8');
      const bufB = Buffer.from(b, 'utf-8');
      return timingSafeEqual(bufA, bufB);
    } catch {
      return false;
    }
  }

  /**
   * Extract token from cookie or Authorization header
   */
  private extractToken(request: Request): string | null {
    if (request.cookies?.accessToken) {
      return request.cookies.accessToken;
    }

    const authHeader = request.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    return null;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if route is public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const apiKey = request.headers['x-api-key'] as string;

    // Strategy 1: Try API Key first (faster than JWE validation)
    if (apiKey) {
      if (!this.validApiKey) {
        this.logger.warn('API_KEY not configured, falling back to JWE');
      } else if (this.timingSafeCompare(apiKey, this.validApiKey)) {
        (request as any).apiKeyAuth = true;
        (request as any).authType = 'apiKey';
        this.logger.log(`[API_KEY_AUTH] Access from ${request.ip}`);
        return true;
      } else {
        this.logger.warn(`[API_KEY_AUTH] Invalid attempt from ${request.ip}`);
        throw new UnauthorizedException('Invalid API Key');
      }
    }

    // Strategy 2: Try JWE authentication
    const token = this.extractToken(request);
    if (token) {
      try {
        const payload = await this.jweTokenService.verifyAccessToken(token);
        (request as any).user = {
          id: payload.sub,
          email: payload.email,
          role: payload.role,
          country: payload.country,
        };
        (request as any).authType = 'jwe';
        return true;
      } catch (error) {
        this.logger.debug('JWE validation failed', error.message);
      }
    }

    throw new UnauthorizedException('Authentication required (JWE or API Key)');
  }
}
