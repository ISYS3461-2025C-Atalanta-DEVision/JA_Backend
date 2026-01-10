import { Injectable, NotFoundException, ConflictException, Logger, InternalServerErrorException, Inject, ForbiddenException, HttpStatus } from '@nestjs/common';
import { JobApplicationRepository, JobApplication } from '../../../libs/dals/mongodb';
import { CreateJobApplicationDto, UpdateJobApplicationDto, JobApplicationResponseDto } from '../apis/job-application/dtos';
import { IJobApplicationService } from '../interfaces';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { firstValueFrom, timeout, catchError, of } from "rxjs";
import { now } from 'mongoose';
import { app } from 'firebase-admin';

@Injectable()
export class JobApplicationService implements IJobApplicationService {
  private readonly logger = new Logger(JobApplicationService.name);

  constructor(
    private readonly jobApplicationRepository: JobApplicationRepository,
    @Inject("APPLICANT_SERVICE") private readonly applicantClient: ClientProxy,
  ) { }

  async create(
    createDto: CreateJobApplicationDto,
    applicantId: string,
  ): Promise<JobApplicationResponseDto> {
    try {
      const applicant = await firstValueFrom(
        this.applicantClient
          .send({ cmd: 'applicant.findById' }, { id: applicantId })
          .pipe(
            timeout(5000),
            catchError(() => of(null)),
          ),
      );

      if (!applicant) {
        throw new RpcException({
          statusCode: HttpStatus.NOT_FOUND,
          message: `Applicant with ID ${applicantId} not found`,
        });
      }

      const existing = await this.jobApplicationRepository.findOne({
        applicantId,
        jobId: createDto.jobId,
      });

      if (existing) {
        throw new RpcException({
          statusCode: HttpStatus.CONFLICT,
          message:
            `Job application already exists for applicant ${applicantId} and job ${createDto.jobId}`,
        });
      }

      const jobApplication = await this.jobApplicationRepository.create({
        ...createDto,
        applicantId,
        appliedAt: new Date(),
      });

      return this.toResponseDto(jobApplication);
    } catch (error) {
      this.logger.error(
        `Create jobApplication failed for applicant ${applicantId}`,
        error?.stack,
      );

      if (error instanceof RpcException) {
        throw error;
      }

      if (error?.code === 11000) {
        throw new RpcException({
          statusCode: HttpStatus.CONFLICT,
          message: 'Duplicate job application',
        });
      }

      throw new RpcException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to create job application',
      });
    }
  }

  async findByApplicantId(
    applicantId: string,
  ): Promise<JobApplicationResponseDto[]> {
    try {
      const applicant = await firstValueFrom(
        this.applicantClient
          .send({ cmd: "applicant.findById" }, { id: applicantId })
          .pipe(
            timeout(5000),
            catchError((error) => {
              this.logger.warn(
                `Failed to validate applicant ${applicantId}: ${error.message}`,
              );
              return of(null);
            }),
          ),
      );

      if (!applicant) {
        throw new NotFoundException(
          `Applicant with ID ${applicantId} not found`,
        );
      }

      const applications = await this.jobApplicationRepository.findMany({
        applicantId: applicantId,
      });

      if (!applications.length) {
        return [];
      }

      return applications.map((wh) => this.toResponseDto(wh));
    } catch (error) {
      this.logger.error(
        `Find job applications failed for Applicant ${applicantId}`,
        error.stack,
      );
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException("Failed to find applications");
    }
  }

  async findByJobId(
    jobId: string,
  ): Promise<JobApplicationResponseDto[]> {
    try {
      // TODO: integrate with JM service to check if jobId is valid

      const applications = await this.jobApplicationRepository.findMany({
        jobId: jobId,
      });

      if (!applications.length) {
        return [];
      }

      return applications.map((wh) => this.toResponseDto(wh));
    } catch (error) {
      this.logger.error(
        `Find job applications failed for job ${jobId}`,
        error.stack,
      );
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException("Failed to find applications");
    }
  }

  async findById(id: string): Promise<JobApplicationResponseDto> {
    try {
      const jobApplication = await this.jobApplicationRepository.findById(id);
      if (!jobApplication) {
        throw new NotFoundException(`JobApplication with ID ${id} not found`);
      }
      return this.toResponseDto(jobApplication);
    } catch (error) {
      this.logger.error(`Find jobApplication failed for ${id}`, error.stack);
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Failed to find jobApplication');
    }
  }

  async findAll(page: number = 1, limit: number = 10): Promise<{
    data: JobApplicationResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      const skip = (page - 1) * limit;
      const [jobApplications, total] = await this.jobApplicationRepository.findManyAndCount(
        {},
        { skip, limit, sort: { createdAt: -1 } },
      );

      return {
        data: jobApplications.map(c => this.toResponseDto(c)),
        total,
        page,
        limit,
      };
    } catch (error) {
      this.logger.error(`Find all job-applications failed`, error.stack);
      throw new InternalServerErrorException('Failed to fetch job-applications');
    }
  }

  async update(id: string, updateDto: UpdateJobApplicationDto): Promise<JobApplicationResponseDto> {
    try {
      const jobApplication = await this.jobApplicationRepository.findById(id);
      if (!jobApplication) {
        throw new NotFoundException(`JobApplication with ID ${id} not found`);
      }

      // Check if applicant is valid and has applied for this position
      const applicant = await firstValueFrom(
        this.applicantClient
          .send({ cmd: "applicant.findById" }, { id: jobApplication.applicantId })
          .pipe(
            timeout(5000),
            catchError((error) => {
              this.logger.warn(
                `Failed to find applicant ${jobApplication.applicantId}: ${error.message}`,
              );
              return of(null);
            }),
          ),
      );

      if (!applicant) {
        throw new NotFoundException(
          `Applicant with ID ${jobApplication.applicantId} not found`,
        );
      }

      if (!applicant.isActive) {
        throw new ForbiddenException('Account is deactivated');
      }

      //TODO: double check jobId with JM service

      const updated = await this.jobApplicationRepository.update(id, updateDto);
      return this.toResponseDto(updated);
    } catch (error) {
      this.logger.error(`Update jobApplication failed for ${id}`, error.stack);
      if (error instanceof NotFoundException || error instanceof ConflictException) throw error;
      if (error.code === 11000) throw new ConflictException('Name already in use');
      throw new InternalServerErrorException('Failed to update jobApplication');
    }
  }

  async delete(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const jobApplication = await this.jobApplicationRepository.findById(id);
      if (!jobApplication) {
        throw new NotFoundException(`JobApplication with ID ${id} not found`);
      }

      // Soft delete - set isActive to false
      await this.jobApplicationRepository.delete(id);
      return {
        success: true,
        message: 'JobApplication deleted successfully',
      };
    } catch (error) {
      this.logger.error(`Delete jobApplication failed for ${id}`, error.stack);
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Failed to delete jobApplication');
    }
  }

  private toResponseDto(
    jobApplication: JobApplication,
  ): JobApplicationResponseDto {
    return {
      id: jobApplication._id.toString(),
      applicantId: jobApplication.applicantId,
      jobId: jobApplication.jobId,
      mediaUrls: jobApplication.mediaUrls,
      appliedAt: jobApplication.appliedAt,
      status: jobApplication.status,
      createdAt: jobApplication.createdAt,
      updatedAt: jobApplication.updatedAt,
    };
  }
}
