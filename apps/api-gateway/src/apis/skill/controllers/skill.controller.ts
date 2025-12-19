import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Inject,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam, ApiQuery } from '@nestjs/swagger';
import { firstValueFrom, timeout, catchError } from 'rxjs';
import { Public, Roles, ApiKeyAuth } from '@auth/decorators';
import { RolesGuard } from '@auth/guards';
import { Role } from '@auth/enums';
import { CreateSkillDto, UpdateSkillDto } from '../dtos';

@ApiTags('Skills')
@Controller('skills')
export class SkillController {
  constructor(
    @Inject('JOB_SKILL_SERVICE') private readonly client: ClientProxy,
  ) {}

  private handleError(error: any) {
    if (error.status) {
      throw error;
    }
    throw error;
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all skills', description: 'Retrieve paginated list of skills' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 10)' })
  @ApiResponse({ status: 200, description: 'List of skills retrieved successfully' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return firstValueFrom(
      this.client.send({ cmd: 'skill.findAll' }, { page, limit }).pipe(
        timeout(5000),
        catchError((err) => {
          this.handleError(err);
          throw err;
        }),
      ),
    );
  }

  @Get('category/:categoryId')
  @Public()
  @ApiOperation({ summary: 'Get skills by category', description: 'Retrieve all skills belonging to a specific category' })
  @ApiParam({ name: 'categoryId', description: 'Job category ID' })
  @ApiResponse({ status: 200, description: 'List of skills for the category' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async findByCategory(@Param('categoryId') categoryId: string) {
    return firstValueFrom(
      this.client.send({ cmd: 'skill.findByCategory' }, { categoryId }).pipe(
        timeout(5000),
        catchError((err) => {
          this.handleError(err);
          throw err;
        }),
      ),
    );
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get skill by ID', description: 'Retrieve a single skill by its ID' })
  @ApiParam({ name: 'id', description: 'Skill ID' })
  @ApiResponse({ status: 200, description: 'Skill retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Skill not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async findById(@Param('id') id: string) {
    return firstValueFrom(
      this.client.send({ cmd: 'skill.findById' }, { id }).pipe(
        timeout(5000),
        catchError((err) => {
          this.handleError(err);
          throw err;
        }),
      ),
    );
  }

  @Post()
  @ApiKeyAuth() // Allow API key OR JWE auth
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create skill', description: 'Create a new skill (requires API key or JWE auth)' })
  @ApiBody({ type: CreateSkillDto })
  @ApiResponse({ status: 201, description: 'Skill created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async create(@Body() createDto: CreateSkillDto, @Req() req: any) {
    // Pass createdBy if user context exists (JWT auth)
    const createdBy = req.user?.id;
    const payload = createdBy ? { ...createDto, createdBy } : createDto;

    return firstValueFrom(
      this.client.send({ cmd: 'skill.create' }, payload).pipe(
        timeout(5000),
        catchError((err) => {
          this.handleError(err);
          throw err;
        }),
      ),
    );
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Update skill', description: 'Update an existing skill (Admin only)' })
  @ApiParam({ name: 'id', description: 'Skill ID' })
  @ApiBody({ type: UpdateSkillDto })
  @ApiResponse({ status: 200, description: 'Skill updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  @ApiResponse({ status: 404, description: 'Skill not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async update(@Param('id') id: string, @Body() updateDto: UpdateSkillDto) {
    return firstValueFrom(
      this.client.send({ cmd: 'skill.update' }, { id, updates: updateDto }).pipe(
        timeout(5000),
        catchError((err) => {
          this.handleError(err);
          throw err;
        }),
      ),
    );
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Soft delete skill', description: 'Soft delete a skill (Admin only)' })
  @ApiParam({ name: 'id', description: 'Skill ID' })
  @ApiResponse({ status: 200, description: 'Skill soft deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  @ApiResponse({ status: 404, description: 'Skill not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async softDelete(@Param('id') id: string) {
    return firstValueFrom(
      this.client.send({ cmd: 'skill.delete' }, { id }).pipe(
        timeout(5000),
        catchError((err) => {
          this.handleError(err);
          throw err;
        }),
      ),
    );
  }

  @Delete(':id/hard')
  @UseGuards(RolesGuard)
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Hard delete skill', description: 'Permanently delete a skill (Admin only)' })
  @ApiParam({ name: 'id', description: 'Skill ID' })
  @ApiResponse({ status: 200, description: 'Skill permanently deleted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  @ApiResponse({ status: 404, description: 'Skill not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async hardDelete(@Param('id') id: string) {
    return firstValueFrom(
      this.client.send({ cmd: 'skill.hardDelete' }, { id }).pipe(
        timeout(5000),
        catchError((err) => {
          this.handleError(err);
          throw err;
        }),
      ),
    );
  }
}
