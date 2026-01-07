import { Controller, Inject } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { WORK_HISTORY_SERVICE_WEB_PROVIDER } from '../../../constants';
import { IWorkHistoryService } from '../../../interfaces';
import { CreateWorkHistoryDto, UpdateWorkHistoryDto } from '../dtos';

@Controller()
export class WorkHistoryController {
  constructor(
    @Inject(WORK_HISTORY_SERVICE_WEB_PROVIDER)
    private readonly workHistoryService: IWorkHistoryService,
  ) { }

  @MessagePattern({ cmd: 'workHistory.create' })
  async create(@Payload() data: { createDto: CreateWorkHistoryDto, applicantId: string }) {
    return await this.workHistoryService.create(data.createDto, data.applicantId);
  }

  @MessagePattern({ cmd: 'workHistory.findById' })
  async findById(@Payload() data: { id: string }) {
    return await this.workHistoryService.findById(data.id);
  }

  @MessagePattern({ cmd: 'workHistory.findAll' })
  async findAll(@Payload() data: { page?: number; limit?: number }) {
    const page = data.page || 1;
    const limit = data.limit || 10;
    return await this.workHistoryService.findAll(page, limit);
  }

  @MessagePattern({ cmd: 'workHistory.update' })
  async update(@Payload() data: { id: string; updates: UpdateWorkHistoryDto }) {
    return await this.workHistoryService.update(data.id, data.updates);
  }

  @MessagePattern({ cmd: 'workHistory.delete' })
  async delete(@Payload() data: { id: string }) {
    return await this.workHistoryService.delete(data.id);
  }
}
