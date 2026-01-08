import { registerAs } from '@nestjs/config';

export const appConfig = registerAs('app_config', () => ({
  dbUrl: process.env.DB_URL,
  // Service ports
  servicePort: parseInt(process.env.WORK_HISTORY_SERVICE_PORT || '3007', 10),
  serviceHost: process.env.WORK_HISTORY_SERVICE_HOST || '0.0.0.0',
  healthPort: parseInt(process.env.HEALTH_PORT || '3017', 10),

  // Applicant Service (TCP)
  applicantServiceHost: process.env.APPLICANT_SERVICE_HOST || 'localhost',
  applicantServicePort: parseInt(process.env.APPLICANT_SERVICE_PORT || '3002', 10),
}));
