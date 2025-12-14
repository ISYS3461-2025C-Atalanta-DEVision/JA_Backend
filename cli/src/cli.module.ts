import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MongodbModule } from '../../apps/admin-service/src/libs/dals/mongodb/mongodb.module';
import { SeedAdminCommand } from './commands/seed-admin.command';

@Module({
  imports: [
    // Connect to MongoDB using admin-service configuration
    MongooseModule.forRootAsync({
      useFactory: () => ({
        uri: process.env.DB_URL || 'mongodb://localhost:27017/admin-applicants',
        retryAttempts: 3,
        retryDelay: 1000,
      }),
    }),

    // Import admin-service MongoDB module (schemas + repositories)
    MongodbModule,
  ],
  providers: [SeedAdminCommand],
})
export class CliModule { }
