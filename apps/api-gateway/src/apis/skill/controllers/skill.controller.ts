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
import { firstValueFrom, timeout, catchError } from 'rxjs';
import { Public, Roles, ApiKeyAuth } from '@auth/decorators';
import { RolesGuard } from '@auth/guards';
import { Role } from '@auth/enums';
import { CreateSkillDto, UpdateSkillDto } from '../dtos';

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
