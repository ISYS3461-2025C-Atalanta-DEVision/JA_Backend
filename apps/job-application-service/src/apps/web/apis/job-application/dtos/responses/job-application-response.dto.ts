import { JobApplicationStatus } from "apps/job-application-service/src/libs/dals";

export class JobApplicationResponseDto {
  id: string;
  applicantId: string;
  jobId: string;
  cvMediaId?: string;
  appliedAt: Date;
  status: JobApplicationStatus;
  createdAt: Date;
  updatedAt: Date;
}
