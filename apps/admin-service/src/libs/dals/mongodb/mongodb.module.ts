import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminApplicant, AdminApplicantSchema } from './schemas';
import { AdminApplicantRepositoryProvider } from './providers';
import { AdminApplicantRepository } from './repositories';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AdminApplicant.name, schema: AdminApplicantSchema },
    ]),
  ],
  providers: [
    AdminApplicantRepository,
    AdminApplicantRepositoryProvider,
  ],
  exports: [
    MongooseModule,
    AdminApplicantRepository,
    AdminApplicantRepositoryProvider,
  ],
})
export class MongodbModule {}
