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
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Request } from 'express';
import { CurrentUser, ApiKeyAuth } from '@auth/decorators';
import { AuthenticatedUser } from '@auth/interfaces';
import { CreateApplicantDto } from '../dtos/requests/create-applicant.dto';
import { UpdateApplicantDto } from '../dtos/requests/update-applicant.dto';
import { firstValueFrom, timeout, catchError } from 'rxjs';

@Controller('applicants')
export class ApplicantController {
  private readonly logger = new Logger(ApplicantController.name);

  constructor(
    @Inject('APPLICANT_SERVICE') private readonly applicantClient: ClientProxy,
  ) {}

  @Post()
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() createDto: CreateApplicantDto,
  ) {
    this.logger.log(`User ${user.email} creating applicant`);
    try {
      const result = await firstValueFrom(
        this.applicantClient
          .send({ cmd: 'applicant.create' }, { ...createDto, userId: user.id })
          .pipe(
            timeout(5000),
            catchError((error) => {
              throw new HttpException(
                error.message || 'Applicant service unavailable',
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
        error.message || 'Failed to create applicant',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id')
  @ApiKeyAuth()
  async findById(
    @CurrentUser() user: AuthenticatedUser | undefined,
    @Param('id') id: string,
    @Req() request: Request,
  ) {
    const authType = (request as any).authType || 'jwt';
    const identifier = authType === 'jwt' && user ? user.email : 'API Key';
    this.logger.log(`${identifier} accessing applicant ${id}`);

    try {
      const result = await firstValueFrom(
        this.applicantClient
          .send({ cmd: 'applicant.findById' }, { id })
          .pipe(
            timeout(5000),
            catchError((error) => {
              throw new HttpException(
                error.message || 'Applicant not found',
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
        error.message || 'Failed to fetch applicant',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get()
  @ApiKeyAuth()
  async findAll(
    @CurrentUser() user: AuthenticatedUser | undefined,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Req() request: Request,
  ) {
    const authType = (request as any).authType || 'jwt';
    const identifier = authType === 'jwt' && user ? user.email : 'API Key';
    this.logger.log(`${identifier} listing applicants (page ${page})`);

    try {
      const result = await firstValueFrom(
        this.applicantClient
          .send({ cmd: 'applicant.findAll' }, { page: Number(page), limit: Number(limit) })
          .pipe(
            timeout(5000),
            catchError((error) => {
              throw new HttpException(
                error.message || 'Failed to fetch applicants',
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
        'Failed to fetch applicants',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put(':id')
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() updateDto: UpdateApplicantDto,
  ) {
    this.logger.log(`User ${user.email} updating applicant ${id}`);
    try {
      const result = await firstValueFrom(
        this.applicantClient
          .send({ cmd: 'applicant.update' }, { id, updates: updateDto, userId: user.id })
          .pipe(
            timeout(5000),
            catchError((error) => {
              throw new HttpException(
                error.message || 'Failed to update applicant',
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
        error.message || 'Failed to update applicant',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete(':id')
  async delete(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    this.logger.log(`User ${user.email} deleting applicant ${id}`);
    try {
      const result = await firstValueFrom(
        this.applicantClient
          .send({ cmd: 'applicant.delete' }, { id, userId: user.id })
          .pipe(
            timeout(5000),
            catchError((error) => {
              throw new HttpException(
                error.message || 'Failed to delete applicant',
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
        error.message || 'Failed to delete applicant',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
