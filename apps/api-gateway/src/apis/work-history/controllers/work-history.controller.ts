import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpStatus,
  HttpException,
  Inject,
  Logger,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam, ApiQuery } from '@nestjs/swagger';
import { Request } from 'express';
import { CurrentUser, ApiKeyAuth, Public } from '@auth/decorators';
import { AuthenticatedUser } from '@auth/interfaces';
import { EmailVerifiedGuard } from '@auth/guards';
import { firstValueFrom, timeout, catchError } from 'rxjs';
import { CreateWorkHistoryDto, UpdateWorkHistoryDto } from '../dtos';

@ApiTags('Work History')
@Controller('work-history')
@UseGuards(EmailVerifiedGuard)
export class WorkHistoryController {
  private readonly logger = new Logger(WorkHistoryController.name);

  constructor(
    @Inject('WORK_HISTORY_SERVICE') private readonly workHistoryClient: ClientProxy,
  ) { }

  @Post()
  @ApiOperation({ summary: 'Create work history', description: 'Create a new work history profile (requires JWE auth)' })
  @ApiBody({ type: CreateWorkHistoryDto })
  @ApiResponse({ status: 201, description: 'work history created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() createDto: CreateWorkHistoryDto,
  ) {
    this.logger.log(`User ${user.email} creating work history`);
    try {
      const result = await firstValueFrom(
        this.workHistoryClient
          .send({ cmd: 'workHistory.create' }, { ...createDto, applicantId: user.id })
          .pipe(
            timeout(5000),
            catchError((error) => {
              throw new HttpException(
                error.message || 'work history service unavailable',
                error.status || HttpStatus.INTERNAL_SERVER_ERROR,
              );
            }),
          ),
      );
      return result;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error.message || 'Failed to create work history',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id')
  @ApiKeyAuth()
  @ApiOperation({ summary: 'Get work history by ID', description: 'Retrieve a single work history by ID (requires API key or JWE auth)' })
  @ApiParam({ name: 'id', description: 'work history ID' })
  @ApiResponse({ status: 200, description: 'work history retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'work history not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async findById(
    @CurrentUser() user: AuthenticatedUser | undefined,
    @Param('id') id: string,
    @Req() request: Request,
  ) {
    const authType = (request as any).authType || 'jwt';
    const identifier = authType === 'jwt' && user ? user.email : 'API Key';
    this.logger.log(`${identifier} accessing work history ${id}`);

    try {
      const result = await firstValueFrom(
        this.workHistoryClient
          .send({ cmd: 'workHistory.findById' }, { id })
          .pipe(
            timeout(5000),
            catchError((error) => {
              throw new HttpException(
                error.message || 'work history not found',
                error.status || HttpStatus.NOT_FOUND,
              );
            }),
          ),
      );
      return result;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error.message || 'Failed to fetch work history',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get()
  @ApiKeyAuth()
  @ApiOperation({ summary: 'Get all work historys', description: 'Retrieve paginated list of work historys (requires API key or JWE auth)' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 10)' })
  @ApiResponse({ status: 200, description: 'List of work historys retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async findAll(
    @CurrentUser() user: AuthenticatedUser | undefined,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Req() request: Request,
  ) {
    const authType = (request as any).authType || 'jwt';
    const identifier = authType === 'jwt' && user ? user.email : 'API Key';
    this.logger.log(`${identifier} listing work historys (page ${page})`);

    try {
      const result = await firstValueFrom(
        this.workHistoryClient
          .send({ cmd: 'workHistory.findAll' }, { page: Number(page), limit: Number(limit) })
          .pipe(
            timeout(5000),
            catchError((error) => {
              throw new HttpException(
                error.message || 'Failed to fetch work historys',
                error.status || HttpStatus.INTERNAL_SERVER_ERROR,
              );
            }),
          ),
      );
      return result;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to fetch work historys',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update work history', description: 'Update an existing work history profile (requires JWE auth)' })
  @ApiParam({ name: 'id', description: 'work history ID' })
  @ApiBody({ type: UpdateWorkHistoryDto })
  @ApiResponse({ status: 200, description: 'work history updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'work history not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() updateDto: UpdateWorkHistoryDto,
  ) {
    this.logger.log(`User ${user.email} updating work history ${id}`);
    try {
      const result = await firstValueFrom(
        this.workHistoryClient
          .send({ cmd: 'workHistory.update' }, { id, updates: updateDto, userId: user.id })
          .pipe(
            timeout(5000),
            catchError((error) => {
              throw new HttpException(
                error.message || 'Failed to update work history',
                error.status || HttpStatus.INTERNAL_SERVER_ERROR,
              );
            }),
          ),
      );
      return result;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error.message || 'Failed to update work history',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete work history', description: 'Delete an work history profile (requires JWE auth)' })
  @ApiParam({ name: 'id', description: 'work history ID' })
  @ApiResponse({ status: 200, description: 'work history deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'work history not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async delete(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    this.logger.log(`User ${user.email} deleting work history ${id}`);
    try {
      const result = await firstValueFrom(
        this.workHistoryClient
          .send({ cmd: 'workHistory.delete' }, { id, userId: user.id })
          .pipe(
            timeout(5000),
            catchError((error) => {
              throw new HttpException(
                error.message || 'Failed to delete work history',
                error.status || HttpStatus.NOT_FOUND,
              );
            }),
          ),
      );
      return result;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error.message || 'Failed to delete work history',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
