import { registerAs } from '@nestjs/config';

export const appConfig = registerAs('app_config', () => ({
  // Service ports
  port: parseInt(process.env.API_GATEWAY_PORT || '3000', 10),
  host: process.env.API_GATEWAY_HOST || '0.0.0.0',
}));
