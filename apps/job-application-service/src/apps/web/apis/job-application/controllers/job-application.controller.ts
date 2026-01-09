import { Controller, Inject } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { JOB_APPLICATION_SERVICE_WEB_PROVIDER } from '../../../constants';
import { IJobApplicationService } from '../../../interfaces';
import { CreateJobApplicationDto, UpdateJobApplicationDto } from '../dtos';

@Controller()
export class JobApplicationController {
  constructor(
    @Inject(JOB_APPLICATION_SERVICE_WEB_PROVIDER)
    private readonly jobApplicationService: IJobApplicationService,
  ) { }

  @MessagePattern({ cmd: 'jobApplication.create' })
  async create(@Payload() data: { createDto: CreateJobApplicationDto, applicantId: string }) {
    return await this.jobApplicationService.create(data.createDto, data.applicantId);
  }

  @MessagePattern({ cmd: 'jobApplication.findById' })
  async findById(@Payload() data: { id: string }) {
    return await this.jobApplicationService.findById(data.id);
  }

  @MessagePattern({ cmd: 'jobApplication.findByApplicantId' })
  async findByApplicantId(@Payload() data: { applicantId: string }) {
    return await this.jobApplicationService.findByApplicantId(data.applicantId);
  }

  @MessagePattern({ cmd: 'jobApplication.findAll' })
  async findAll(@Payload() data: { page?: number; limit?: number }) {
    const page = data.page || 1;
    const limit = data.limit || 10;
    return await this.jobApplicationService.findAll(page, limit);
  }

  @MessagePattern({ cmd: 'jobApplication.update' })
  async update(@Payload() data: { id: string; updates: UpdateJobApplicationDto }) {
    return await this.jobApplicationService.update(data.id, data.updates);
  }

  @MessagePattern({ cmd: 'jobApplication.delete' })
  async delete(@Payload() data: { id: string }) {
    return await this.jobApplicationService.delete(data.id);
  }
}
