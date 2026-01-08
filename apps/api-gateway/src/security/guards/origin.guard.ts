import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { EnvUtil } from "@libs/common/utils/environment.util";

@Injectable()
export class OriginGuard implements CanActivate {
  private readonly allowedOrigins: string[];

  constructor(private readonly configService: ConfigService) {
    // Get allowed origins from config, fallback to defaults if not configured
    const configuredOrigins = this.configService.get<string>("ALLOWED_ORIGINS");

    if (configuredOrigins) {
      this.allowedOrigins = configuredOrigins
        .split(",")
        .map((origin) => origin.trim());
    } else {
      this.allowedOrigins = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:8080",
        "https://diachimoi.vn",
        "https://beta.diachimoi.vn",
        "https://www.diachimoi.vn",
        "https://www.beta.diachimoi.vn",
      ];
    }
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const origin = request.headers.origin || request.headers.referer;

    if (!origin && EnvUtil.isDevelopment()) {
      return true;
    }

    if (!origin) {
      throw new ForbiddenException("Origin not allowed");
    }

    const isAllowed = this.allowedOrigins.some((allowedOrigin) =>
      origin.startsWith(allowedOrigin),
    );

    if (!isAllowed) {
      throw new ForbiddenException("Origin not allowed");
    }

    return true;
  }
}
