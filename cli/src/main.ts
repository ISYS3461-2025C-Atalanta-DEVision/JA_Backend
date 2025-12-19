#!/usr/bin/env node
import * as dotenv from 'dotenv';
import { resolve } from 'path';
import { CommandFactory } from 'nest-commander';
import { CliModule } from './cli.module';

/**
 * Determine which service's env file to load based on command
 */
function getEnvPath(): string {
  const args = process.argv.slice(2);
  const command = args[0] || '';

  // Map commands to their service env files
  if (command.startsWith('seed:job-skills')) {
    return resolve(__dirname, '../../apps/job-skill-service/.env.development');
  }

  // Default to admin-service for seed:admin and other commands
  return resolve(__dirname, '../../apps/admin-service/.env.development');
}

// Load environment variables based on command
const envPath = getEnvPath();
dotenv.config({ path: envPath });

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
