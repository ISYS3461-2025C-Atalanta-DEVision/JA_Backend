#!/usr/bin/env node
import * as dotenv from 'dotenv';
import { resolve } from 'path';
import { CommandFactory } from 'nest-commander';
import { CliModule } from './cli.module';

// Load environment variables from admin-service
dotenv.config({
  path: resolve(__dirname, '../../apps/admin-service/.env.development'),
});

async function bootstrap() {
  await CommandFactory.run(CliModule, {
    logger: ['error', 'warn', 'log'],
    errorHandler: (err) => {
      console.error('Command failed:', err.message);
      process.exit(1);
    },
  });
}

bootstrap();
