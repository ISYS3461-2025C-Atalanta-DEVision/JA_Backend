import { registerAs } from "@nestjs/config";

export const appConfig = registerAs("app_config", () => ({
  // Database
  dbUrl: process.env.DB_URL,

  // Service ports
  servicePort: parseInt(process.env.ADMIN_SERVICE_PORT || "3003", 10),
  serviceHost: process.env.ADMIN_SERVICE_HOST || "0.0.0.0",
  healthPort: parseInt(process.env.HEALTH_PORT || "3013", 10),
}));
