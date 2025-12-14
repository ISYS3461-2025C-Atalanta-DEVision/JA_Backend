import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  AdminApplicant,
  AdminApplicantSchema,
  AdminOAuthAccount,
  AdminOAuthAccountSchema,
} from './schemas';
import { AdminApplicantRepositoryProvider } from './providers';
import {
  AdminApplicantRepository,
  AdminOAuthAccountRepository,
} from './repositories';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AdminApplicant.name, schema: AdminApplicantSchema },
      { name: AdminOAuthAccount.name, schema: AdminOAuthAccountSchema },
    ]),
  ],
  providers: [
    AdminApplicantRepository,
    AdminApplicantRepositoryProvider,
    AdminOAuthAccountRepository,
  ],
  exports: [
    MongooseModule,
    AdminApplicantRepository,
    AdminApplicantRepositoryProvider,
    AdminOAuthAccountRepository,
  ],
})
export class MongodbModule {}
