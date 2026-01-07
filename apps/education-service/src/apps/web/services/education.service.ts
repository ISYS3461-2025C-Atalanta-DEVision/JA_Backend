import { Injectable, NotFoundException, ConflictException, Logger, InternalServerErrorException } from '@nestjs/common';
import { EducationRepository, Education } from '../../../libs/dals/mongodb';
import { CreateEducationDto, UpdateEducationDto, EducationResponseDto } from '../apis/education/dtos';
import { IEducationService } from '../interfaces';

@Injectable()
export class EducationService implements IEducationService {
  private readonly logger = new Logger(EducationService.name);

  constructor(
    private readonly educationRepository: EducationRepository,
  ) {}

  async create(createDto: CreateEducationDto): Promise<EducationResponseDto> {
    try {
      // Check for duplicate name (optional - remove if not needed)
      const existing = await this.educationRepository.findByName(createDto.name);
      if (existing) {
        throw new ConflictException('Education with this name already exists');
      }

      const education = await this.educationRepository.create(createDto);
      return this.toResponseDto(education);
    } catch (error) {
      this.logger.error(`Create education failed for ${createDto.name}`, error.stack);
      if (error instanceof ConflictException) throw error;
      if (error.code === 11000) throw new ConflictException('Education with this name already exists');
      throw new InternalServerErrorException('Failed to create education');
    }
  }

  async findById(id: string): Promise<EducationResponseDto> {
    try {
      const education = await this.educationRepository.findById(id);
      if (!education) {
        throw new NotFoundException(`Education with ID ${id} not found`);
      }
      return this.toResponseDto(education);
    } catch (error) {
      this.logger.error(`Find education failed for ${id}`, error.stack);
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Failed to find education');
    }
  }

  async findAll(page: number = 1, limit: number = 10): Promise<{
    data: EducationResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      const skip = (page - 1) * limit;
      const [educations, total] = await this.educationRepository.findManyAndCount(
        {},
        { skip, limit, sort: { createdAt: -1 } },
      );

      return {
        data: educations.map(c => this.toResponseDto(c)),
        total,
        page,
        limit,
      };
    } catch (error) {
      this.logger.error(`Find all educations failed`, error.stack);
      throw new InternalServerErrorException('Failed to fetch educations');
    }
  }

  async update(id: string, updateDto: UpdateEducationDto): Promise<EducationResponseDto> {
    try {
      const education = await this.educationRepository.findById(id);
      if (!education) {
        throw new NotFoundException(`Education with ID ${id} not found`);
      }

      // Check for duplicate name if name is being updated
      if (updateDto.name && updateDto.name !== education.name) {
        const existing = await this.educationRepository.findByName(updateDto.name);
        if (existing) {
          throw new ConflictException('Name already in use');
        }
      }

      const updated = await this.educationRepository.update(id, updateDto);
      return this.toResponseDto(updated);
    } catch (error) {
      this.logger.error(`Update education failed for ${id}`, error.stack);
      if (error instanceof NotFoundException || error instanceof ConflictException) throw error;
      if (error.code === 11000) throw new ConflictException('Name already in use');
      throw new InternalServerErrorException('Failed to update education');
    }
  }

  async delete(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const education = await this.educationRepository.findById(id);
      if (!education) {
        throw new NotFoundException(`Education with ID ${id} not found`);
      }

      // Soft delete - set isActive to false
      await this.educationRepository.update(id, { isActive: false });
      return {
        success: true,
        message: 'Education deleted successfully',
      };
    } catch (error) {
      this.logger.error(`Delete education failed for ${id}`, error.stack);
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Failed to delete education');
    }
  }

  private toResponseDto(education: Education): EducationResponseDto {
    return {
      id: education._id.toString(),
      name: education.name,
      description: education.description,
      isActive: education.isActive,
      createdAt: education.createdAt,
      updatedAt: education.updatedAt,
    };
  }
}
