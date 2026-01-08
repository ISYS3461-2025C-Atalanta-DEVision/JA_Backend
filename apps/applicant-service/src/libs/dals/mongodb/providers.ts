import { Provider } from "@nestjs/common";
import {
  APPLICANT_REPO_PROVIDER,
  OAUTH_ACCOUNT_REPO_PROVIDER,
  SEARCH_PROFILE_REPO_PROVIDER,
} from "./constants";
import {
  IApplicantRepository,
  IOAuthAccountRepository,
  ISearchProfileRepository,
} from "./interfaces";
import {
  ApplicantRepository,
  OAuthAccountRepository,
  SearchProfileRepository,
} from "./repositories";

export const ApplicantRepositoryProvider: Provider<IApplicantRepository> = {
  provide: APPLICANT_REPO_PROVIDER,
  useClass: ApplicantRepository,
};

export const OAuthAccountRepositoryProvider: Provider<IOAuthAccountRepository> =
  {
    provide: OAUTH_ACCOUNT_REPO_PROVIDER,
    useClass: OAuthAccountRepository,
  };

export const SearchProfileRepositoryProvider: Provider<ISearchProfileRepository> =
  {
    provide: SEARCH_PROFILE_REPO_PROVIDER,
    useClass: SearchProfileRepository,
  };
