import { Provider } from '@nestjs/common';
import { JOB_APPLICATION_SERVICE_WEB_PROVIDER } from './constants';
import { JobApplicationService } from './services';
import { IJobApplicationService } from './interfaces';

export const JobApplicationServiceWebProvider: Provider<IJobApplicationService> = {
  provide: JOB_APPLICATION_SERVICE_WEB_PROVIDER,
  useClass: JobApplicationService,
};
