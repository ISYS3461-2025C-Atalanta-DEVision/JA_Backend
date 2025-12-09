import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Applicant, ApplicantSchema, OAuthAccount, OAuthAccountSchema } from './schemas';
import { ApplicantRepositoryProvider, OAuthAccountRepositoryProvider } from './providers';
import { ApplicantRepository, OAuthAccountRepository } from './repositories';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Applicant.name, schema: ApplicantSchema },
      { name: OAuthAccount.name, schema: OAuthAccountSchema },
    ]),
  ],
  providers: [
    ApplicantRepository,
    OAuthAccountRepository,
    ApplicantRepositoryProvider,
    OAuthAccountRepositoryProvider,
  ],
  exports: [
    MongooseModule,
    ApplicantRepository,
    OAuthAccountRepository,
    ApplicantRepositoryProvider,
    OAuthAccountRepositoryProvider,
  ],
})
export class MongodbModule {}
