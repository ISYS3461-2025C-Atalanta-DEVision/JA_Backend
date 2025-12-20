import { Injectable, NotFoundException, ConflictException, Logger, InternalServerErrorException } from '@nestjs/common';
import { JobCategoryRepository, JobCategory, SkillRepository } from '../../../libs/dals/mongodb';
import { CreateJobCategoryDto, UpdateJobCategoryDto, JobCategoryResponseDto } from '../apis/job-category/dtos';
import { IJobCategoryService } from '../interfaces';

@Injectable()
export class JobCategoryService implements IJobCategoryService {
  private readonly logger = new Logger(JobCategoryService.name);

  constructor(
    private readonly jobCategoryRepository: JobCategoryRepository,
    private readonly skillRepository: SkillRepository,
  ) { }

  async create(createDto: CreateJobCategoryDto): Promise<JobCategoryResponseDto> {
    try {
      // Check for duplicate name (optional - remove if not needed)
      const existing = await this.jobCategoryRepository.findByName(createDto.name);
      if (existing) {
        throw new ConflictException('JobCategory with this name already exists');
      }

      const jobCategory = await this.jobCategoryRepository.create(createDto);
      return this.toResponseDto(jobCategory);
    } catch (error) {
      this.logger.error(`Create jobCategory failed for ${createDto.name}`, error.stack);
      if (error instanceof ConflictException) throw error;
      if (error.code === 11000) throw new ConflictException('JobCategory with this name already exists');
      throw new InternalServerErrorException('Failed to create jobCategory');
    }
  }

  async findById(id: string): Promise<JobCategoryResponseDto> {
    try {
      const jobCategory = await this.jobCategoryRepository.findById(id);
      if (!jobCategory) {
        throw new NotFoundException(`JobCategory with ID ${id} not found`);
      }
      return this.toResponseDto(jobCategory);
    } catch (error) {
      this.logger.error(`Find jobCategory failed for ${id}`, error.stack);
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Failed to find jobCategory');
    }
  }

  async findAll(page: number = 1, limit: number = 10): Promise<{
    data: JobCategoryResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      const skip = (page - 1) * limit;
      const [jobCategories, total] = await this.jobCategoryRepository.findManyAndCount(
        {},
        { skip, limit, sort: { createdAt: -1 } },
      );

      return {
        data: jobCategories.map(c => this.toResponseDto(c)),
        total,
        page,
        limit,
      };
    } catch (error) {
      this.logger.error(`Find all job-categories failed`, error.stack);
      throw new InternalServerErrorException('Failed to fetch job-categories');
    }
  }

  async update(id: string, updateDto: UpdateJobCategoryDto): Promise<JobCategoryResponseDto> {
    try {
      const jobCategory = await this.jobCategoryRepository.findById(id);
      if (!jobCategory) {
        throw new NotFoundException(`JobCategory with ID ${id} not found`);
      }

      // Check for duplicate name if name is being updated
      if (updateDto.name && updateDto.name !== jobCategory.name) {
        const existing = await this.jobCategoryRepository.findByName(updateDto.name);
        if (existing) {
          throw new ConflictException('Name already in use');
        }
      }

      const updated = await this.jobCategoryRepository.update(id, updateDto);
      return this.toResponseDto(updated);
    } catch (error) {
      this.logger.error(`Update jobCategory failed for ${id}`, error.stack);
      if (error instanceof NotFoundException || error instanceof ConflictException) throw error;
      if (error.code === 11000) throw new ConflictException('Name already in use');
      throw new InternalServerErrorException('Failed to update jobCategory');
    }
  }

  async delete(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const jobCategory = await this.jobCategoryRepository.findById(id);
      if (!jobCategory) {
        throw new NotFoundException(`JobCategory with ID ${id} not found`);
      }

      // Soft delete - set isActive to false
      await this.jobCategoryRepository.update(id, { isActive: false });

      // Cascade soft delete to skills
      const cascadeCount = await this.skillRepository.softDeleteByJobCategoryId(id);
      this.logger.log(`Cascade soft deleted ${cascadeCount} skills for category ${id}`);

      return {
        success: true,
        message: 'JobCategory deleted successfully',
      };
    } catch (error) {
      this.logger.error(`Delete jobCategory failed for ${id}`, error.stack);
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Failed to delete jobCategory');
    }
  }

  async hardDelete(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const jobCategory = await this.jobCategoryRepository.findById(id);
      if (!jobCategory) {
        throw new NotFoundException(`JobCategory with ID ${id} not found`);
      }

      // Cascade hard delete skills first
      const cascadeCount = await this.skillRepository.hardDeleteByJobCategoryId(id);
      this.logger.log(`Cascade hard deleted ${cascadeCount} skills for category ${id}`);

      // Then hard delete category
      await this.jobCategoryRepository.delete(id);

      return {
        success: true,
        message: 'JobCategory permanently deleted',
      };
    } catch (error) {
      this.logger.error(`Hard delete jobCategory failed for ${id}`, error.stack);
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Failed to permanently delete jobCategory');
    }
  }

  private toResponseDto(jobCategory: JobCategory): JobCategoryResponseDto {
    return {
      id: jobCategory._id.toString(),
      name: jobCategory.name,
      description: jobCategory.description,
      isActive: jobCategory.isActive,
      createdAt: jobCategory.createdAt,
      updatedAt: jobCategory.updatedAt,
      icon: jobCategory.icon
    };
  }
}
