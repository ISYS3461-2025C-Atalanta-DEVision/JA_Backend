import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MongodbModule as AdminMongodbModule } from '../../apps/admin-service/src/libs/dals/mongodb/mongodb.module';
import { MongodbModule as JobSkillMongodbModule } from '../../apps/job-skill-service/src/libs/dals/mongodb/mongodb.module';
import { SeedAdminCommand } from './commands/seed-admin.command';
import { SeedJobSkillsCommand } from './commands/seed-job-skills.command';

@Module({
  imports: [
    // MongoDB connection - uses DB_URL from environment
    MongooseModule.forRootAsync({
      useFactory: () => ({
        uri: process.env.DB_URL || 'mongodb://localhost:27017/cli-db',
        retryAttempts: 3,
        retryDelay: 1000,
      }),
    }),

    // Import admin-service MongoDB module (schemas + repositories)
    AdminMongodbModule,

    // Import job-skill-service MongoDB module (schemas + repositories)
    JobSkillMongodbModule,
  ],
  providers: [SeedAdminCommand, SeedJobSkillsCommand],
})
export class CliModule {}
