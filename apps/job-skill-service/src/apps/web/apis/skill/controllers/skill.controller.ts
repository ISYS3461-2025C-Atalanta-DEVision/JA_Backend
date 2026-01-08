import { Controller, Inject } from "@nestjs/common";
import { MessagePattern, Payload } from "@nestjs/microservices";
import { SKILL_SERVICE_WEB_PROVIDER } from "../../../constants";
import { ISkillService } from "../../../interfaces";
import { CreateSkillDto, UpdateSkillDto } from "../dtos";
import { FindAllQueryParams } from "@common/dtos/filter.dto";

@Controller()
export class SkillController {
  constructor(
    @Inject(SKILL_SERVICE_WEB_PROVIDER)
    private readonly skillService: ISkillService,
  ) {}

  @MessagePattern({ cmd: "skill.create" })
  async create(@Payload() createDto: CreateSkillDto) {
    return await this.skillService.create(createDto);
  }

  @MessagePattern({ cmd: "skill.findById" })
  async findById(@Payload() data: { id: string }) {
    return await this.skillService.findById(data.id);
  }

  @MessagePattern({ cmd: "skill.findAll" })
  async findAll(@Payload() data: FindAllQueryParams) {
    const page = data.page || 1;
    const limit = data.limit || 10;
    return await this.skillService.findAll(
      page,
      limit,
      data.filters,
      data.sorting,
    );
  }

  @MessagePattern({ cmd: "skill.findByCategory" })
  async findByCategory(@Payload() data: { categoryId: string }) {
    return await this.skillService.findByCategory(data.categoryId);
  }

  @MessagePattern({ cmd: "skill.update" })
  async update(@Payload() data: { id: string; updates: UpdateSkillDto }) {
    return await this.skillService.update(data.id, data.updates);
  }

  @MessagePattern({ cmd: "skill.delete" })
  async delete(@Payload() data: { id: string }) {
    return await this.skillService.softDelete(data.id);
  }

  @MessagePattern({ cmd: "skill.hardDelete" })
  async hardDelete(@Payload() data: { id: string }) {
    return await this.skillService.hardDelete(data.id);
  }
}
