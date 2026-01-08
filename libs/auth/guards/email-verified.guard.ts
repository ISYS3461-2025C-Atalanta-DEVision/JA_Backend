import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { IS_PUBLIC_KEY } from "../decorators/public.decorator";

/**
 * Email Verified Guard
 * Ensures user has verified their email before accessing protected resources
 *
 * Usage: @UseGuards(EmailVerifiedGuard) on controller or route
 *
 * Note: This guard should be used AFTER JweAuthGuard or ApiKeyOrJweGuard
 * so that request.user is already populated
 */
@Injectable()
export class EmailVerifiedGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Check if route is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();

    // Skip for API Key auth (service-to-service calls)
    if (request.apiKeyAuth) {
      return true;
    }

    const user = request.user;

    // No user means not authenticated - let other guards handle
    if (!user) {
      return true;
    }

    // Check email verification status
    if (!user.emailVerified) {
      throw new ForbiddenException(
        "Email verification required. Please verify your email to access this resource.",
      );
    }

    return true;
  }
}
