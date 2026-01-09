import { ApiPropertyOptional } from '@nestjs/swagger';
import { JobApplicationStatus } from 'apps/job-application-service/src/libs/dals';
import {
  IsEnum,
  IsMongoId,
  IsOptional,
  IsString,
  IsDateString,
  IsArray,
} from 'class-validator';

export class UpdateJobApplicationDto {
  @ApiPropertyOptional({
    description: 'Media urls',
    example: '66b8f2c8e3a4c9a1b1234567',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  mediaUrls?: string[];

  @ApiPropertyOptional({
    description: 'Current application status, allowed values: PENDING and ARCHIVED (case-sensitive, will fail if not correct)',
    enum: JobApplicationStatus,
    default: JobApplicationStatus.Pending,
  })
  @IsOptional()
  @IsEnum(JobApplicationStatus)
  status?: JobApplicationStatus;
}
