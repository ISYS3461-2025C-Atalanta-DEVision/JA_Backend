import { registerAs } from '@nestjs/config';

export const appConfig = registerAs('app_config', () => ({
  // Database
  dbUrl: process.env.DB_URL,

  // Service ports
  servicePort: parseInt(process.env.JOB_SKILL_SERVICE_PORT || '3004', 10),
  serviceHost: process.env.JOB_SKILL_SERVICE_HOST || '0.0.0.0',
  healthPort: parseInt(process.env.HEALTH_PORT || '3014', 10),
}));
