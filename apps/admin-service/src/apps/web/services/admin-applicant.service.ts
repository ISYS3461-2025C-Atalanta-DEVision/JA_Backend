import { Injectable, NotFoundException, ConflictException, Logger, InternalServerErrorException } from '@nestjs/common';
import { AdminApplicantRepository, AdminApplicant } from '../../../libs/dals/mongodb';
import { CreateAdminApplicantDto, UpdateAdminApplicantDto, AdminApplicantResponseDto } from '../apis/admin-applicant/dtos';
import { IAdminApplicantService } from '../interfaces';

@Injectable()
export class AdminApplicantService implements IAdminApplicantService {
  private readonly logger = new Logger(AdminApplicantService.name);

  constructor(
    private readonly adminApplicantRepository: AdminApplicantRepository,
  ) {}

  async create(createDto: CreateAdminApplicantDto): Promise<AdminApplicantResponseDto> {
    try {
      // Check for duplicate name (optional - remove if not needed)
      const existing = await this.adminApplicantRepository.findByName(createDto.name);
      if (existing) {
        throw new ConflictException('AdminApplicant with this name already exists');
      }

      const adminApplicant = await this.adminApplicantRepository.create(createDto);
      return this.toResponseDto(adminApplicant);
    } catch (error) {
      this.logger.error(`Create adminApplicant failed for ${createDto.name}`, error.stack);
      if (error instanceof ConflictException) throw error;
      if (error.code === 11000) throw new ConflictException('AdminApplicant with this name already exists');
      throw new InternalServerErrorException('Failed to create adminApplicant');
    }
  }

  async findById(id: string): Promise<AdminApplicantResponseDto> {
    try {
      const adminApplicant = await this.adminApplicantRepository.findById(id);
      if (!adminApplicant) {
        throw new NotFoundException(`AdminApplicant with ID ${id} not found`);
      }
      return this.toResponseDto(adminApplicant);
    } catch (error) {
      this.logger.error(`Find adminApplicant failed for ${id}`, error.stack);
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Failed to find adminApplicant');
    }
  }

  async findAll(page: number = 1, limit: number = 10): Promise<{
    data: AdminApplicantResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      const skip = (page - 1) * limit;
      const [adminApplicants, total] = await this.adminApplicantRepository.findManyAndCount(
        {},
        { skip, limit, sort: { createdAt: -1 } },
      );

      return {
        data: adminApplicants.map(c => this.toResponseDto(c)),
        total,
        page,
        limit,
      };
    } catch (error) {
      this.logger.error(`Find all admin-applicants failed`, error.stack);
      throw new InternalServerErrorException('Failed to fetch admin-applicants');
    }
  }

  async update(id: string, updateDto: UpdateAdminApplicantDto): Promise<AdminApplicantResponseDto> {
    try {
      const adminApplicant = await this.adminApplicantRepository.findById(id);
      if (!adminApplicant) {
        throw new NotFoundException(`AdminApplicant with ID ${id} not found`);
      }

      // Check for duplicate name if name is being updated
      if (updateDto.name && updateDto.name !== adminApplicant.name) {
        const existing = await this.adminApplicantRepository.findByName(updateDto.name);
        if (existing) {
          throw new ConflictException('Name already in use');
        }
      }

      const updated = await this.adminApplicantRepository.update(id, updateDto);
      return this.toResponseDto(updated);
    } catch (error) {
      this.logger.error(`Update adminApplicant failed for ${id}`, error.stack);
      if (error instanceof NotFoundException || error instanceof ConflictException) throw error;
      if (error.code === 11000) throw new ConflictException('Name already in use');
      throw new InternalServerErrorException('Failed to update adminApplicant');
    }
  }

  async delete(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const adminApplicant = await this.adminApplicantRepository.findById(id);
      if (!adminApplicant) {
        throw new NotFoundException(`AdminApplicant with ID ${id} not found`);
      }

      // Soft delete - set isActive to false
      await this.adminApplicantRepository.update(id, { isActive: false });
      return {
        success: true,
        message: 'AdminApplicant deleted successfully',
      };
    } catch (error) {
      this.logger.error(`Delete adminApplicant failed for ${id}`, error.stack);
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Failed to delete adminApplicant');
    }
  }

  private toResponseDto(adminApplicant: AdminApplicant): AdminApplicantResponseDto {
    return {
      id: adminApplicant._id.toString(),
      name: adminApplicant.name,
      description: adminApplicant.description,
      isActive: adminApplicant.isActive,
      createdAt: adminApplicant.createdAt,
      updatedAt: adminApplicant.updatedAt,
    };
  }
}
