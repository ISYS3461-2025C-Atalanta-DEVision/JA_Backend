import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JobApplication, JobApplicationSchema } from './schemas';
import { JobApplicationRepositoryProvider } from './providers';
import { JobApplicationRepository } from './repositories';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: JobApplication.name, schema: JobApplicationSchema },
    ]),
  ],
  providers: [
    JobApplicationRepository,
    JobApplicationRepositoryProvider,
  ],
  exports: [
    MongooseModule,
    JobApplicationRepository,
    JobApplicationRepositoryProvider,
  ],
})
export class MongodbModule {}
