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
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { CreateApplicantDto } from '../dtos/requests/create-applicant.dto';
import { UpdateApplicantDto } from '../dtos/requests/update-applicant.dto';
import { firstValueFrom, timeout, catchError } from 'rxjs';

@Controller('applicants')
export class ApplicantController {
  constructor(
    @Inject('APPLICANT_SERVICE') private readonly applicantClient: ClientProxy,
  ) {}

  @Post()
  async create(@Body() createDto: CreateApplicantDto) {
    try {
      const result = await firstValueFrom(
        this.applicantClient
          .send({ cmd: 'applicant.create' }, createDto)
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
  async findById(@Param('id') id: string) {
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
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
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
  async update(@Param('id') id: string, @Body() updateDto: UpdateApplicantDto) {
    try {
      const result = await firstValueFrom(
        this.applicantClient
          .send({ cmd: 'applicant.update' }, { id, updates: updateDto })
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
  async delete(@Param('id') id: string) {
    try {
      const result = await firstValueFrom(
        this.applicantClient
          .send({ cmd: 'applicant.delete' }, { id })
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
