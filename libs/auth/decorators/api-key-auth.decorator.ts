import { applyDecorators, UseGuards } from '@nestjs/common';
import { ApiKeyOrJweGuard } from '../guards/api-key-or-jwe.guard';

/**
 * Allows authentication via JWE (Bearer token/cookie) OR API Key (X-API-Key header).
 *
 * Use on endpoints that external services need to access.
 * - JWE auth: @CurrentUser() will be populated with AuthenticatedUser
 * - API Key auth: @CurrentUser() will be undefined
 *
 * @example
 * ```typescript
 * @Get()
 * @ApiKeyAuth()
 * async findAll(@CurrentUser() user: AuthenticatedUser | undefined) {
 *   // user is defined for JWE, undefined for API Key
 * }
 * ```
 */
export function ApiKeyAuth() {
  return applyDecorators(UseGuards(ApiKeyOrJweGuard));
}
