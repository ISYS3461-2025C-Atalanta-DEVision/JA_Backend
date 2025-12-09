import { Provider } from '@nestjs/common';
import { ADMIN_APPLICANT_SERVICE_WEB_PROVIDER } from './constants';
import { AdminApplicantService } from './services';
import { IAdminApplicantService } from './interfaces';

export const AdminApplicantServiceWebProvider: Provider<IAdminApplicantService> = {
  provide: ADMIN_APPLICANT_SERVICE_WEB_PROVIDER,
  useClass: AdminApplicantService,
};
