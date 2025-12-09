import { Provider } from '@nestjs/common';
import { APPLICANT_REPO_PROVIDER, OAUTH_ACCOUNT_REPO_PROVIDER } from './constants';
import { IApplicantRepository, IOAuthAccountRepository } from './interfaces';
import { ApplicantRepository, OAuthAccountRepository } from './repositories';

export const ApplicantRepositoryProvider: Provider<IApplicantRepository> = {
  provide: APPLICANT_REPO_PROVIDER,
  useClass: ApplicantRepository,
};

export const OAuthAccountRepositoryProvider: Provider<IOAuthAccountRepository> = {
  provide: OAUTH_ACCOUNT_REPO_PROVIDER,
  useClass: OAuthAccountRepository,
};
