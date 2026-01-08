import { Provider } from "@nestjs/common";
import {
  APPLICANT_SERVICE_WEB_PROVIDER,
  APPLICANT_AUTH_SERVICE_WEB_PROVIDER,
  SEARCH_PROFILE_SERVICE_PROVIDER,
} from "./constants";
import {
  ApplicantService,
  ApplicantAuthService,
  SearchProfileService,
} from "./services";
import { IApplicantService, IApplicantAuthService } from "./interfaces";

export const ApplicantServiceWebProvider: Provider<IApplicantService> = {
  provide: APPLICANT_SERVICE_WEB_PROVIDER,
  useClass: ApplicantService,
};

export const ApplicantAuthServiceWebProvider: Provider<IApplicantAuthService> =
  {
    provide: APPLICANT_AUTH_SERVICE_WEB_PROVIDER,
    useClass: ApplicantAuthService,
  };

export const SearchProfileServiceProvider: Provider<SearchProfileService> = {
  provide: SEARCH_PROFILE_SERVICE_PROVIDER,
  useClass: SearchProfileService,
};
