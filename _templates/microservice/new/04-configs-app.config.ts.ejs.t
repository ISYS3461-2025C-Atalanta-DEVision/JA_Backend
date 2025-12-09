---
to: apps/<%= kebabName %>/src/configs/app.config.ts
---
import { registerAs } from '@nestjs/config';

export const appConfig = registerAs('app_config', () => ({
  dbUrl: process.env.DB_URL,
}));
