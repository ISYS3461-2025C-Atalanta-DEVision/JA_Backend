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
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, timeout, catchError } from 'rxjs';
import { Public, Roles } from '@auth/decorators';
import { ApiKeyOrJweGuard, RolesGuard } from '@auth/guards';
import { Role } from '@auth/enums';
import { CreateJobCategoryDto, UpdateJobCategoryDto } from '../dtos';

@Controller('job-categories')
export class JobCategoryController {
  constructor(
    @Inject('JOB_SKILL_SERVICE') private readonly client: ClientProxy,
  ) { }

  private handleError(error: any) {
    if (error.status) {
      throw error;
    }
    throw error;
  }

  @Get()
  @Public()
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return firstValueFrom(
      this.client.send({ cmd: 'jobCategory.findAll' }, { page, limit }).pipe(
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
  async findById(@Param('id') id: string) {
    return firstValueFrom(
      this.client.send({ cmd: 'jobCategory.findById' }, { id }).pipe(
        timeout(5000),
        catchError((err) => {
          this.handleError(err);
          throw err;
        }),
      ),
    );
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.Admin)
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createDto: CreateJobCategoryDto) {
    return firstValueFrom(
      this.client.send({ cmd: 'jobCategory.create' }, createDto).pipe(
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
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateJobCategoryDto,
  ) {
    return firstValueFrom(
      this.client
        .send({ cmd: 'jobCategory.update' }, { id, updates: updateDto })
        .pipe(
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
  async softDelete(@Param('id') id: string) {
    return firstValueFrom(
      this.client.send({ cmd: 'jobCategory.delete' }, { id }).pipe(
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
  async hardDelete(@Param('id') id: string) {
    return firstValueFrom(
      this.client.send({ cmd: 'jobCategory.hardDelete' }, { id }).pipe(
        timeout(5000),
        catchError((err) => {
          this.handleError(err);
          throw err;
        }),
      ),
    );
  }
}
