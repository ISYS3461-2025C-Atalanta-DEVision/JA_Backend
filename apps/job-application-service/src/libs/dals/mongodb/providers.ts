import { Provider } from '@nestjs/common';
import { JOB_APPLICATION_REPO_PROVIDER } from './constants';
import { IJobApplicationRepository } from './interfaces';
import { JobApplicationRepository } from './repositories';

export const JobApplicationRepositoryProvider: Provider<IJobApplicationRepository> = {
  provide: JOB_APPLICATION_REPO_PROVIDER,
  useClass: JobApplicationRepository,
};
