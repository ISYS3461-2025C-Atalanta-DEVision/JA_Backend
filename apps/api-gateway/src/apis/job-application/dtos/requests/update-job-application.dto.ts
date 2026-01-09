import { JobApplicationStatus } from 'apps/job-application-service/src/libs/dals';
import {
  IsEnum,
  IsMongoId,
  IsOptional,
  IsString,
  IsDateString,
} from 'class-validator';

export class UpdateJobApplicationDto {
  @IsOptional()
  @IsMongoId()
  cvMediaId?: string;

  @IsOptional()
  @IsEnum(JobApplicationStatus)
  status?: JobApplicationStatus;
}
