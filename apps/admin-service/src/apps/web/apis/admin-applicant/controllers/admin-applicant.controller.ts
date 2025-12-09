import { Controller, Inject } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ADMIN_APPLICANT_SERVICE_WEB_PROVIDER } from '../../../constants';
import { IAdminApplicantService } from '../../../interfaces';
import { CreateAdminApplicantDto, UpdateAdminApplicantDto } from '../dtos';

@Controller()
export class AdminApplicantController {
  constructor(
    @Inject(ADMIN_APPLICANT_SERVICE_WEB_PROVIDER)
    private readonly adminApplicantService: IAdminApplicantService,
  ) {}

  @MessagePattern({ cmd: 'adminApplicant.create' })
  async create(@Payload() createDto: CreateAdminApplicantDto) {
    return await this.adminApplicantService.create(createDto);
  }

  @MessagePattern({ cmd: 'adminApplicant.findById' })
  async findById(@Payload() data: { id: string }) {
    return await this.adminApplicantService.findById(data.id);
  }

  @MessagePattern({ cmd: 'adminApplicant.findAll' })
  async findAll(@Payload() data: { page?: number; limit?: number }) {
    const page = data.page || 1;
    const limit = data.limit || 10;
    return await this.adminApplicantService.findAll(page, limit);
  }

  @MessagePattern({ cmd: 'adminApplicant.update' })
  async update(@Payload() data: { id: string; updates: UpdateAdminApplicantDto }) {
    return await this.adminApplicantService.update(data.id, data.updates);
  }

  @MessagePattern({ cmd: 'adminApplicant.delete' })
  async delete(@Payload() data: { id: string }) {
    return await this.adminApplicantService.delete(data.id);
  }
}
