import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
  InternalServerErrorException,
  BadRequestException,
} from "@nestjs/common";
import {
  SkillRepository,
  Skill,
  JobCategoryRepository,
} from "../../../libs/dals/mongodb";
import {
  CreateSkillDto,
  UpdateSkillDto,
  SkillResponseDto,
} from "../apis/skill/dtos";
import { ISkillService } from "../interfaces";
import { FilterBuilder } from "@common/filters";
import { FilterItem, SortItem } from "@common/dtos/filter.dto";
import { SKILL_FILTER_CONFIG } from "../../../configs";

@Injectable()
export class SkillService implements ISkillService {
  private readonly logger = new Logger(SkillService.name);
  private readonly filterBuilder = new FilterBuilder<Skill>(SKILL_FILTER_CONFIG);

  constructor(
    private readonly skillRepository: SkillRepository,
    private readonly jobCategoryRepository: JobCategoryRepository,
  ) {}

  async create(createDto: CreateSkillDto): Promise<SkillResponseDto> {
    try {
      // Validate jobCategoryId exists and is active
      const jobCategory = await this.jobCategoryRepository.findById(
        createDto.jobCategoryId,
      );
      if (!jobCategory) {
        throw new BadRequestException("Job category not found");
      }
      if (!jobCategory.isActive) {
        throw new BadRequestException("Job category is not active");
      }

      // Check for duplicate name (globally unique)
      const existing = await this.skillRepository.findByName(createDto.name);
      if (existing) {
        throw new ConflictException("Skill with this name already exists");
      }

      const skill = await this.skillRepository.create(createDto);
      return this.toResponseDto(skill);
    } catch (error) {
      this.logger.error(`Create skill failed`, error.stack);
      if (
        error instanceof ConflictException ||
        error instanceof BadRequestException
      )
        throw error;
      if (error.code === 11000)
        throw new ConflictException("Skill with this name already exists");
      throw new InternalServerErrorException("Failed to create skill");
    }
  }

  async findById(id: string): Promise<SkillResponseDto> {
    try {
      const skill = await this.skillRepository.findById(id);
      if (!skill) {
        throw new NotFoundException(`Skill with ID ${id} not found`);
      }
      return this.toResponseDto(skill);
    } catch (error) {
      this.logger.error(`Find skill failed for ${id}`, error.stack);
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException("Failed to find skill");
    }
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    filters?: FilterItem[],
    sorting?: SortItem[],
  ): Promise<{
    data: SkillResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      const skip = (page - 1) * limit;
      const query = this.filterBuilder.buildQuery(filters);
      const sort = this.filterBuilder.buildSort(sorting);

      const [skills, total] = await this.skillRepository.findManyAndCount(
        query,
        { skip, limit, sort },
      );

      return {
        data: skills.map((s) => this.toResponseDto(s)),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      this.logger.error(`Find all skills failed`, error.stack);
      throw new InternalServerErrorException("Failed to fetch skills");
    }
  }

  async findByCategory(categoryId: string): Promise<SkillResponseDto[]> {
    try {
      // Validate categoryId exists
      const jobCategory = await this.jobCategoryRepository.findById(categoryId);
      if (!jobCategory) {
        throw new NotFoundException(
          `Job category with ID ${categoryId} not found`,
        );
      }

      const skills = await this.skillRepository.findByJobCategoryId(categoryId);
      return skills.map((s) => this.toResponseDto(s));
    } catch (error) {
      this.logger.error(
        `Find skills by category failed for ${categoryId}`,
        error.stack,
      );
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(
        "Failed to fetch skills by category",
      );
    }
  }

  async update(
    id: string,
    updateDto: UpdateSkillDto,
  ): Promise<SkillResponseDto> {
    try {
      const skill = await this.skillRepository.findById(id);
      if (!skill) {
        throw new NotFoundException(`Skill with ID ${id} not found`);
      }

      // Check for duplicate name if name is being updated
      if (updateDto.name && updateDto.name !== skill.name) {
        const existing = await this.skillRepository.findByName(updateDto.name);
        if (existing) {
          throw new ConflictException("Name already in use");
        }
      }

      const updated = await this.skillRepository.update(id, updateDto);
      return this.toResponseDto(updated);
    } catch (error) {
      this.logger.error(`Update skill failed for ${id}`, error.stack);
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      )
        throw error;
      if (error.code === 11000)
        throw new ConflictException("Name already in use");
      throw new InternalServerErrorException("Failed to update skill");
    }
  }

  async softDelete(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const skill = await this.skillRepository.findById(id);
      if (!skill) {
        throw new NotFoundException(`Skill with ID ${id} not found`);
      }

      await this.skillRepository.update(id, { isActive: false });
      return {
        success: true,
        message: "Skill deleted successfully",
      };
    } catch (error) {
      this.logger.error(`Soft delete skill failed for ${id}`, error.stack);
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException("Failed to delete skill");
    }
  }

  async hardDelete(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const skill = await this.skillRepository.findById(id);
      if (!skill) {
        throw new NotFoundException(`Skill with ID ${id} not found`);
      }

      await this.skillRepository.delete(id);
      return {
        success: true,
        message: "Skill permanently deleted",
      };
    } catch (error) {
      this.logger.error(`Hard delete skill failed for ${id}`, error.stack);
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(
        "Failed to permanently delete skill",
      );
    }
  }

  private toResponseDto(skill: Skill): SkillResponseDto {
    return {
      id: skill._id.toString(),
      name: skill.name,
      jobCategoryId: skill.jobCategoryId,
      description: skill.description,
      icon: skill.icon,
      createdBy: skill.createdBy,
      isActive: skill.isActive,
      createdAt: skill.createdAt,
      updatedAt: skill.updatedAt,
    };
  }
}
