import { applyDecorators, SetMetadata, UseGuards } from "@nestjs/common";
import { ApiKeyOrJweGuard } from "../guards/api-key-or-jwe.guard";
import { EmailVerifiedGuard } from "../guards/email-verified.guard";
import { ApiSecurity } from "@nestjs/swagger";

export const ALLOW_API_KEY = "allowApiKey";

/**
 * Allows authentication via JWE (Bearer token/cookie) OR API Key (X-API-Key header).
 *
 * Use on endpoints that external services need to access.
 * - JWE auth: @CurrentUser() will be populated with AuthenticatedUser
 * - API Key auth: @CurrentUser() will be undefined
 *
 * Note: EmailVerifiedGuard runs after ApiKeyOrJweGuard to ensure proper guard order.
 * API Key auth bypasses email verification (service-to-service calls).
 *
 * @example
 * ```typescript
 * @Post()
 * @ApiKeyAuth()
 * async create(@CurrentUser() user: AuthenticatedUser | undefined) {
 *   // user is defined for JWE, undefined for API Key
 * }
 * ```
 */
export function ApiKeyAuth() {
  return applyDecorators(
    SetMetadata(ALLOW_API_KEY, true),
    UseGuards(ApiKeyOrJweGuard, EmailVerifiedGuard),
    ApiSecurity("api-key"),
  );
}
