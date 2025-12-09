import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { JweTokenService } from '../services/jwe-token.service';

/**
 * JWE Auth Guard
 * Validates JWE encrypted access tokens from cookies or Authorization header
 * Replaces JwtAuthGuard for JWE-based authentication
 */
@Injectable()
export class JweAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jweTokenService: JweTokenService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if route is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException('No access token provided');
    }

    try {
      // Verify and decrypt JWE token
      const payload = await this.jweTokenService.verifyAccessToken(token);

      // Attach user to request
      (request as any).user = {
        id: payload.sub,
        email: payload.email,
        role: payload.role,
        country: payload.country,
      };

      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  /**
   * Extract token from cookie or Authorization header
   */
  private extractToken(request: Request): string | null {
    // First try to extract from cookie
    if (request.cookies?.accessToken) {
      return request.cookies.accessToken;
    }

    // Fallback to Authorization header
    const authHeader = request.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    return null;
  }
}
