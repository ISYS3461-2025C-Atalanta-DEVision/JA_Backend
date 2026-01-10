import { JobApplicationStatus } from 'apps/job-application-service/src/libs/dals';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsArray,
} from 'class-validator';

export class UpdateJobApplicationDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  mediaUrls?: string[];

  @IsOptional()
  @IsEnum(JobApplicationStatus)
  status?: JobApplicationStatus;
}
