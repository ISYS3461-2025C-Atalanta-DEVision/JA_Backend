import { Controller, Inject } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { EDUCATION_SERVICE_WEB_PROVIDER } from '../../../constants';
import { IEducationService } from '../../../interfaces';
import { CreateEducationDto, UpdateEducationDto } from '../dtos';

@Controller()
export class EducationController {
  constructor(
    @Inject(EDUCATION_SERVICE_WEB_PROVIDER)
    private readonly educationService: IEducationService,
  ) { }

  @MessagePattern({ cmd: 'education.create' })
  async create(@Payload() data: { createDto: CreateEducationDto, applicantId: string }) {
    return await this.educationService.create(data.createDto, data.applicantId);
  }

  @MessagePattern({ cmd: 'education.findByApplicantId' })
  async findByApplicantId(@Payload() data: { applicantId: string }) {
    return await this.educationService.findByApplicantId(data.applicantId);
  }

  @MessagePattern({ cmd: 'education.findById' })
  async findById(@Payload() data: { id: string }) {
    return await this.educationService.findById(data.id);
  }

  @MessagePattern({ cmd: 'education.findAll' })
  async findAll(@Payload() data: { page?: number; limit?: number }) {
    const page = data.page || 1;
    const limit = data.limit || 10;
    return await this.educationService.findAll(page, limit);
  }

  @MessagePattern({ cmd: 'education.update' })
  async update(@Payload() data: { id: string; updates: UpdateEducationDto }) {
    return await this.educationService.update(data.id, data.updates);
  }

  @MessagePattern({ cmd: 'education.delete' })
  async delete(@Payload() data: { id: string }) {
    return await this.educationService.delete(data.id);
  }
}
