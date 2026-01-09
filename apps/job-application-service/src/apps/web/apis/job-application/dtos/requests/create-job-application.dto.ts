import { JobApplicationStatus } from 'apps/job-application-service/src/libs/dals';
import {
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsDateString,
} from 'class-validator';

export class CreateJobApplicationDto {
  name(name: any) {
    throw new Error('Method not implemented.');
  }
  @IsNotEmpty()
  @IsString()
  jobId: string;

  @IsOptional()
  @IsMongoId()
  cvMediaId?: string;

  @IsOptional()
  @IsEnum(JobApplicationStatus)
  status?: JobApplicationStatus;
}
