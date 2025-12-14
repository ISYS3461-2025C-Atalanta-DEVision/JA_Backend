import { Provider } from '@nestjs/common';
import {
  ADMIN_APPLICANT_SERVICE_WEB_PROVIDER,
  ADMIN_AUTH_SERVICE_WEB_PROVIDER,
} from './constants';
import { AdminApplicantService, AdminAuthService } from './services';
import { IAdminApplicantService, IAdminAuthService } from './interfaces';

export const AdminApplicantServiceWebProvider: Provider<IAdminApplicantService> = {
  provide: ADMIN_APPLICANT_SERVICE_WEB_PROVIDER,
  useClass: AdminApplicantService,
};

export const AdminAuthServiceWebProvider: Provider<IAdminAuthService> = {
  provide: ADMIN_AUTH_SERVICE_WEB_PROVIDER,
  useClass: AdminAuthService,
};
