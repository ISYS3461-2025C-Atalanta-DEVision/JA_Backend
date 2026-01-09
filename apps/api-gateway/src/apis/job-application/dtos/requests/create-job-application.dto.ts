import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsDateString,
} from 'class-validator';
import { JobApplicationStatus } from './job-application.enums';

export class CreateJobApplicationDto {
  @ApiProperty({
    description: 'Target job identifier',
    example: 'JOB-2025-001',
  })
  @IsNotEmpty()
  @IsString()
  jobId: string;

  @ApiPropertyOptional({
    description: 'Uploaded CV media MongoDB ObjectId',
    example: '66b8f2c8e3a4c9a1b1234567',
  })
  @IsOptional()
  @IsMongoId()
  cvMediaId?: string;

  @ApiPropertyOptional({
    description: 'Current application status, allowed values: PENDING and ARCHIVED (case-sensitive, will fail if not correct)',
    enum: JobApplicationStatus,
    default: JobApplicationStatus.Pending,
  })
  @IsOptional()
  @IsEnum(JobApplicationStatus)
  status?: JobApplicationStatus;
}
