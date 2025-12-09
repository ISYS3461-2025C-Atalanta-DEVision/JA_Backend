---
to: apps/<%= kebabName %>/src/apps/web/services/<%= entityKebab %>.service.ts
---
import { Injectable, NotFoundException, ConflictException, Logger, InternalServerErrorException } from '@nestjs/common';
import { <%= entityPascal %>Repository, <%= entityPascal %> } from '../../../libs/dals/mongodb';
import { Create<%= entityPascal %>Dto, Update<%= entityPascal %>Dto, <%= entityPascal %>ResponseDto } from '../apis/<%= entityKebab %>/dtos';
import { I<%= entityPascal %>Service } from '../interfaces';

@Injectable()
export class <%= entityPascal %>Service implements I<%= entityPascal %>Service {
  private readonly logger = new Logger(<%= entityPascal %>Service.name);

  constructor(
    private readonly <%= entityCamel %>Repository: <%= entityPascal %>Repository,
  ) {}

  async create(createDto: Create<%= entityPascal %>Dto): Promise<<%= entityPascal %>ResponseDto> {
    try {
      // Check for duplicate name (optional - remove if not needed)
      const existing = await this.<%= entityCamel %>Repository.findByName(createDto.name);
      if (existing) {
        throw new ConflictException('<%= entityPascal %> with this name already exists');
      }

      const <%= entityCamel %> = await this.<%= entityCamel %>Repository.create(createDto);
      return this.toResponseDto(<%= entityCamel %>);
    } catch (error) {
      this.logger.error(`Create <%= entityCamel %> failed for ${createDto.name}`, error.stack);
      if (error instanceof ConflictException) throw error;
      if (error.code === 11000) throw new ConflictException('<%= entityPascal %> with this name already exists');
      throw new InternalServerErrorException('Failed to create <%= entityCamel %>');
    }
  }

  async findById(id: string): Promise<<%= entityPascal %>ResponseDto> {
    try {
      const <%= entityCamel %> = await this.<%= entityCamel %>Repository.findById(id);
      if (!<%= entityCamel %>) {
        throw new NotFoundException(`<%= entityPascal %> with ID ${id} not found`);
      }
      return this.toResponseDto(<%= entityCamel %>);
    } catch (error) {
      this.logger.error(`Find <%= entityCamel %> failed for ${id}`, error.stack);
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Failed to find <%= entityCamel %>');
    }
  }

  async findAll(page: number = 1, limit: number = 10): Promise<{
    data: <%= entityPascal %>ResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      const skip = (page - 1) * limit;
      const [<%= entityPluralCamel %>, total] = await this.<%= entityCamel %>Repository.findManyAndCount(
        {},
        { skip, limit, sort: { createdAt: -1 } },
      );

      return {
        data: <%= entityPluralCamel %>.map(c => this.toResponseDto(c)),
        total,
        page,
        limit,
      };
    } catch (error) {
      this.logger.error(`Find all <%= entityPlural %> failed`, error.stack);
      throw new InternalServerErrorException('Failed to fetch <%= entityPlural %>');
    }
  }

  async update(id: string, updateDto: Update<%= entityPascal %>Dto): Promise<<%= entityPascal %>ResponseDto> {
    try {
      const <%= entityCamel %> = await this.<%= entityCamel %>Repository.findById(id);
      if (!<%= entityCamel %>) {
        throw new NotFoundException(`<%= entityPascal %> with ID ${id} not found`);
      }

      // Check for duplicate name if name is being updated
      if (updateDto.name && updateDto.name !== <%= entityCamel %>.name) {
        const existing = await this.<%= entityCamel %>Repository.findByName(updateDto.name);
        if (existing) {
          throw new ConflictException('Name already in use');
        }
      }

      const updated = await this.<%= entityCamel %>Repository.update(id, updateDto);
      return this.toResponseDto(updated);
    } catch (error) {
      this.logger.error(`Update <%= entityCamel %> failed for ${id}`, error.stack);
      if (error instanceof NotFoundException || error instanceof ConflictException) throw error;
      if (error.code === 11000) throw new ConflictException('Name already in use');
      throw new InternalServerErrorException('Failed to update <%= entityCamel %>');
    }
  }

  async delete(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const <%= entityCamel %> = await this.<%= entityCamel %>Repository.findById(id);
      if (!<%= entityCamel %>) {
        throw new NotFoundException(`<%= entityPascal %> with ID ${id} not found`);
      }

      // Soft delete - set isActive to false
      await this.<%= entityCamel %>Repository.update(id, { isActive: false });
      return {
        success: true,
        message: '<%= entityPascal %> deleted successfully',
      };
    } catch (error) {
      this.logger.error(`Delete <%= entityCamel %> failed for ${id}`, error.stack);
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Failed to delete <%= entityCamel %>');
    }
  }

  private toResponseDto(<%= entityCamel %>: <%= entityPascal %>): <%= entityPascal %>ResponseDto {
    return {
      id: <%= entityCamel %>._id.toString(),
      name: <%= entityCamel %>.name,
      description: <%= entityCamel %>.description,
      isActive: <%= entityCamel %>.isActive,
      createdAt: <%= entityCamel %>.createdAt,
      updatedAt: <%= entityCamel %>.updatedAt,
    };
  }
}
