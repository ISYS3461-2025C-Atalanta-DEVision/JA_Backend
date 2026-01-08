import { Controller, Inject } from "@nestjs/common";
import { MessagePattern, Payload } from "@nestjs/microservices";
import { JOB_CATEGORY_SERVICE_WEB_PROVIDER } from "../../../constants";
import { IJobCategoryService } from "../../../interfaces";
import { CreateJobCategoryDto, UpdateJobCategoryDto } from "../dtos";
import { FindAllQueryParams } from "@common/dtos/filter.dto";

@Controller()
export class JobCategoryController {
  constructor(
    @Inject(JOB_CATEGORY_SERVICE_WEB_PROVIDER)
    private readonly jobCategoryService: IJobCategoryService,
  ) {}

  @MessagePattern({ cmd: "jobCategory.create" })
  async create(@Payload() createDto: CreateJobCategoryDto) {
    return await this.jobCategoryService.create(createDto);
  }

  @MessagePattern({ cmd: "jobCategory.findById" })
  async findById(@Payload() data: { id: string }) {
    return await this.jobCategoryService.findById(data.id);
  }

  @MessagePattern({ cmd: "jobCategory.findAll" })
  async findAll(@Payload() data: FindAllQueryParams) {
    const page = data.page || 1;
    const limit = data.limit || 10;
    return await this.jobCategoryService.findAll(
      page,
      limit,
      data.filters,
      data.sorting,
    );
  }

  @MessagePattern({ cmd: "jobCategory.update" })
  async update(@Payload() data: { id: string; updates: UpdateJobCategoryDto }) {
    return await this.jobCategoryService.update(data.id, data.updates);
  }

  @MessagePattern({ cmd: "jobCategory.delete" })
  async delete(@Payload() data: { id: string }) {
    return await this.jobCategoryService.delete(data.id);
  }

  @MessagePattern({ cmd: "jobCategory.hardDelete" })
  async hardDelete(@Payload() data: { id: string }) {
    return await this.jobCategoryService.hardDelete(data.id);
  }
}
