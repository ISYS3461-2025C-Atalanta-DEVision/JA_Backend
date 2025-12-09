---
to: apps/<%= kebabName %>/src/apps/web/apis/<%= entityKebab %>/controllers/<%= entityKebab %>.controller.ts
---
import { Controller, Inject } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { <%= entityUpperSnake %>_SERVICE_WEB_PROVIDER } from '../../../constants';
import { I<%= entityPascal %>Service } from '../../../interfaces';
import { Create<%= entityPascal %>Dto, Update<%= entityPascal %>Dto } from '../dtos';

@Controller()
export class <%= entityPascal %>Controller {
  constructor(
    @Inject(<%= entityUpperSnake %>_SERVICE_WEB_PROVIDER)
    private readonly <%= entityCamel %>Service: I<%= entityPascal %>Service,
  ) {}

  @MessagePattern({ cmd: '<%= entityCamel %>.create' })
  async create(@Payload() createDto: Create<%= entityPascal %>Dto) {
    return await this.<%= entityCamel %>Service.create(createDto);
  }

  @MessagePattern({ cmd: '<%= entityCamel %>.findById' })
  async findById(@Payload() data: { id: string }) {
    return await this.<%= entityCamel %>Service.findById(data.id);
  }

  @MessagePattern({ cmd: '<%= entityCamel %>.findAll' })
  async findAll(@Payload() data: { page?: number; limit?: number }) {
    const page = data.page || 1;
    const limit = data.limit || 10;
    return await this.<%= entityCamel %>Service.findAll(page, limit);
  }

  @MessagePattern({ cmd: '<%= entityCamel %>.update' })
  async update(@Payload() data: { id: string; updates: Update<%= entityPascal %>Dto }) {
    return await this.<%= entityCamel %>Service.update(data.id, data.updates);
  }

  @MessagePattern({ cmd: '<%= entityCamel %>.delete' })
  async delete(@Payload() data: { id: string }) {
    return await this.<%= entityCamel %>Service.delete(data.id);
  }
}
