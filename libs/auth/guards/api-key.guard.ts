import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { timingSafeEqual } from "crypto";

const MIN_API_KEY_LENGTH = 32;

/**
 * Guard that validates X-API-Key header for service-to-service authentication.
 * Use this guard standalone when you only want API Key auth (no JWT fallback).
 */
@Injectable()
export class ApiKeyGuard implements CanActivate {
  private readonly logger = new Logger(ApiKeyGuard.name);
  private readonly validApiKey: string | undefined;

  constructor(private readonly configService: ConfigService) {
    this.validApiKey = this.configService.get<string>("API_KEY");

    if (!this.validApiKey) {
      this.logger.warn("API_KEY not configured in environment");
    } else if (this.validApiKey.length < MIN_API_KEY_LENGTH) {
      this.logger.error(
        `API_KEY must be at least ${MIN_API_KEY_LENGTH} characters for security. ` +
          "Generate with: openssl rand -base64 32",
      );
    }
  }

  /**
   * Timing-safe string comparison to prevent timing attacks.
   */
  private timingSafeCompare(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }

    try {
      const bufA = Buffer.from(a, "utf-8");
      const bufB = Buffer.from(b, "utf-8");
      return timingSafeEqual(bufA, bufB);
    } catch {
      return false;
    }
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers["x-api-key"];

    if (!apiKey) {
      return false; // No API Key provided
    }

    if (!this.validApiKey) {
      this.logger.error("API_KEY not configured, rejecting request");
      throw new UnauthorizedException("API Key authentication not configured");
    }

    const isValid = this.timingSafeCompare(apiKey, this.validApiKey);

    if (isValid) {
      // Mark request as API Key authenticated
      request.apiKeyAuth = true;
      request.authType = "apiKey";
      this.logger.log(`[API_KEY_AUTH] Valid access from ${request.ip}`);
      return true;
    }

    this.logger.warn(`[API_KEY_AUTH] Invalid attempt from ${request.ip}`);
    return false;
  }
}
