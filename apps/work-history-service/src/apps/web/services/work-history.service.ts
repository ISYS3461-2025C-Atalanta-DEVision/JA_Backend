import { Injectable, NotFoundException, ConflictException, Logger, InternalServerErrorException } from '@nestjs/common';
import { WorkHistoryRepository, WorkHistory } from '../../../libs/dals/mongodb';
import { CreateWorkHistoryDto, UpdateWorkHistoryDto, WorkHistoryResponseDto } from '../apis/work-history/dtos';
import { IWorkHistoryService } from '../interfaces';

@Injectable()
export class WorkHistoryService implements IWorkHistoryService {
  private readonly logger = new Logger(WorkHistoryService.name);

  constructor(
    private readonly workHistoryRepository: WorkHistoryRepository,
  ) {}

  async create(createDto: CreateWorkHistoryDto): Promise<WorkHistoryResponseDto> {
    try {
      // Check for duplicate name (optional - remove if not needed)
      const existing = await this.workHistoryRepository.findByName(createDto.name);
      if (existing) {
        throw new ConflictException('WorkHistory with this name already exists');
      }

      const workHistory = await this.workHistoryRepository.create(createDto);
      return this.toResponseDto(workHistory);
    } catch (error) {
      this.logger.error(`Create workHistory failed for ${createDto.name}`, error.stack);
      if (error instanceof ConflictException) throw error;
      if (error.code === 11000) throw new ConflictException('WorkHistory with this name already exists');
      throw new InternalServerErrorException('Failed to create workHistory');
    }
  }

  async findById(id: string): Promise<WorkHistoryResponseDto> {
    try {
      const workHistory = await this.workHistoryRepository.findById(id);
      if (!workHistory) {
        throw new NotFoundException(`WorkHistory with ID ${id} not found`);
      }
      return this.toResponseDto(workHistory);
    } catch (error) {
      this.logger.error(`Find workHistory failed for ${id}`, error.stack);
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Failed to find workHistory');
    }
  }

  async findAll(page: number = 1, limit: number = 10): Promise<{
    data: WorkHistoryResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      const skip = (page - 1) * limit;
      const [workHistories, total] = await this.workHistoryRepository.findManyAndCount(
        {},
        { skip, limit, sort: { createdAt: -1 } },
      );

      return {
        data: workHistories.map(c => this.toResponseDto(c)),
        total,
        page,
        limit,
      };
    } catch (error) {
      this.logger.error(`Find all work-histories failed`, error.stack);
      throw new InternalServerErrorException('Failed to fetch work-histories');
    }
  }

  async update(id: string, updateDto: UpdateWorkHistoryDto): Promise<WorkHistoryResponseDto> {
    try {
      const workHistory = await this.workHistoryRepository.findById(id);
      if (!workHistory) {
        throw new NotFoundException(`WorkHistory with ID ${id} not found`);
      }

      // Check for duplicate name if name is being updated
      if (updateDto.name && updateDto.name !== workHistory.name) {
        const existing = await this.workHistoryRepository.findByName(updateDto.name);
        if (existing) {
          throw new ConflictException('Name already in use');
        }
      }

      const updated = await this.workHistoryRepository.update(id, updateDto);
      return this.toResponseDto(updated);
    } catch (error) {
      this.logger.error(`Update workHistory failed for ${id}`, error.stack);
      if (error instanceof NotFoundException || error instanceof ConflictException) throw error;
      if (error.code === 11000) throw new ConflictException('Name already in use');
      throw new InternalServerErrorException('Failed to update workHistory');
    }
  }

  async delete(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const workHistory = await this.workHistoryRepository.findById(id);
      if (!workHistory) {
        throw new NotFoundException(`WorkHistory with ID ${id} not found`);
      }

      // Soft delete - set isActive to false
      await this.workHistoryRepository.update(id, { isActive: false });
      return {
        success: true,
        message: 'WorkHistory deleted successfully',
      };
    } catch (error) {
      this.logger.error(`Delete workHistory failed for ${id}`, error.stack);
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Failed to delete workHistory');
    }
  }

  private toResponseDto(workHistory: WorkHistory): WorkHistoryResponseDto {
    return {
      id: workHistory._id.toString(),
      name: workHistory.name,
      description: workHistory.description,
      isActive: workHistory.isActive,
      createdAt: workHistory.createdAt,
      updatedAt: workHistory.updatedAt,
    };
  }
}
