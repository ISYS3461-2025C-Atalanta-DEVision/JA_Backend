import { JobApplicationResponseDto } from '../apis/job-application/dtos';
import { CreateJobApplicationDto, UpdateJobApplicationDto } from '../apis/job-application/dtos';

export interface IJobApplicationService {
  create(createDto: CreateJobApplicationDto, applicantId: string): Promise<JobApplicationResponseDto>;
  findById(id: string): Promise<JobApplicationResponseDto>;
  findByApplicantId(applicantId: string): Promise<JobApplicationResponseDto[]>;
  // findByJobId(jobId: string): Promise<JobApplicationResponseDto[]>;
  findAll(page: number, limit: number): Promise<{
    data: JobApplicationResponseDto[];
    total: number;
    page: number;
    limit: number;
  }>;
  update(id: string, updateDto: UpdateJobApplicationDto): Promise<JobApplicationResponseDto>;
  delete(id: string): Promise<{ success: boolean; message: string }>;
}
