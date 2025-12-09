import { Controller, Inject } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { APPLICANT_SERVICE_WEB_PROVIDER } from '../../../constants';
import { IApplicantService } from '../../../interfaces';
import { CreateApplicantDto, UpdateApplicantDto } from '../dtos';

@Controller()
export class ApplicantController {
  constructor(
    @Inject(APPLICANT_SERVICE_WEB_PROVIDER)
    private readonly applicantService: IApplicantService,
  ) {}

  @MessagePattern({ cmd: 'applicant.create' })
  async create(@Payload() createDto: CreateApplicantDto) {
    return await this.applicantService.create(createDto);
  }

  @MessagePattern({ cmd: 'applicant.findById' })
  async findById(@Payload() data: { id: string }) {
    return await this.applicantService.findById(data.id);
  }

  @MessagePattern({ cmd: 'applicant.findAll' })
  async findAll(@Payload() data: { page?: number; limit?: number }) {
    const page = data.page || 1;
    const limit = data.limit || 10;
    return await this.applicantService.findAll(page, limit);
  }

  @MessagePattern({ cmd: 'applicant.update' })
  async update(@Payload() data: { id: string; updates: UpdateApplicantDto }) {
    return await this.applicantService.update(data.id, data.updates);
  }

  @MessagePattern({ cmd: 'applicant.delete' })
  async delete(@Payload() data: { id: string }) {
    return await this.applicantService.delete(data.id);
  }
}
