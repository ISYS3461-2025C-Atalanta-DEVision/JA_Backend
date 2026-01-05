import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Applicant,
  ApplicantSchema,
  OAuthAccount,
  OAuthAccountSchema,
  SearchProfile,
  SearchProfileSchema,
} from './schemas';
import {
  ApplicantRepositoryProvider,
  OAuthAccountRepositoryProvider,
  SearchProfileRepositoryProvider,
} from './providers';
import {
  ApplicantRepository,
  OAuthAccountRepository,
  SearchProfileRepository,
} from './repositories';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Applicant.name, schema: ApplicantSchema },
      { name: OAuthAccount.name, schema: OAuthAccountSchema },
      { name: SearchProfile.name, schema: SearchProfileSchema },
    ]),
  ],
  providers: [
    ApplicantRepository,
    OAuthAccountRepository,
    SearchProfileRepository,
    ApplicantRepositoryProvider,
    OAuthAccountRepositoryProvider,
    SearchProfileRepositoryProvider,
  ],
  exports: [
    MongooseModule,
    ApplicantRepository,
    OAuthAccountRepository,
    SearchProfileRepository,
    ApplicantRepositoryProvider,
    OAuthAccountRepositoryProvider,
    SearchProfileRepositoryProvider,
  ],
})
export class MongodbModule {}
