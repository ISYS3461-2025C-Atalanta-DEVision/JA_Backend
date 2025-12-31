import { Injectable, NotFoundException, ConflictException, Logger, InternalServerErrorException } from '@nestjs/common';
import { ApplicantRepository, Applicant } from '../../../libs/dals/mongodb';
import { CreateApplicantDto, UpdateApplicantDto, ApplicantResponseDto } from '../apis/applicant/dtos';
import { IApplicantService } from '../interfaces';
import { MailerService } from '@libs/mailer';
import { generateEmailVerificationToken } from '@libs/auth';

@Injectable()
export class ApplicantService implements IApplicantService {
  private readonly logger = new Logger(ApplicantService.name);

  constructor(
    private readonly applicantRepository: ApplicantRepository,
    private readonly mailerService: MailerService,
  ) { }

  async create(createDto: CreateApplicantDto): Promise<ApplicantResponseDto> {
    try {
      const existing = await this.applicantRepository.findByEmail(createDto.email);
      if (existing) {
        throw new ConflictException('Applicant with this email already exists');
      }

      const applicant = await this.applicantRepository.create(createDto);
      return this.toResponseDto(applicant);
    } catch (error) {
      this.logger.error(`Create applicant failed for ${createDto.email}`, error.stack);
      if (error instanceof ConflictException) throw error;
      if (error.code === 11000) throw new ConflictException('Applicant with this email already exists');
      throw new InternalServerErrorException('Failed to create applicant');
    }
  }

  async findById(id: string): Promise<ApplicantResponseDto> {
    try {
      const applicant = await this.applicantRepository.findById(id);
      if (!applicant) {
        throw new NotFoundException(`Applicant with ID ${id} not found`);
      }
      return this.toResponseDto(applicant);
    } catch (error) {
      this.logger.error(`Find applicant failed for ${id}`, error.stack);
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Failed to find applicant');
    }
  }

  async findAll(page: number = 1, limit: number = 10): Promise<{
    data: ApplicantResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      const skip = (page - 1) * limit;
      const [applicants, total] = await this.applicantRepository.findManyAndCount(
        {},
        { skip, limit, sort: { createdAt: -1 } },
      );

      return {
        data: applicants.map(c => this.toResponseDto(c)),
        total,
        page,
        limit,
      };
    } catch (error) {
      this.logger.error(`Find all applicants failed`, error.stack);
      throw new InternalServerErrorException('Failed to fetch applicants');
    }
  }

  async update(id: string, updateDto: UpdateApplicantDto): Promise<ApplicantResponseDto> {
    try {
      const applicant = await this.applicantRepository.findById(id);
      if (!applicant) {
        throw new NotFoundException(`Applicant with ID ${id} not found`);
      }

      if (updateDto.email && updateDto.email !== applicant.email) {
        const existing = await this.applicantRepository.findByEmail(updateDto.email);
        if (existing) {
          throw new ConflictException('Email already in use');
        }
      }

      const updated = await this.applicantRepository.update(id, updateDto);
      return this.toResponseDto(updated);
    } catch (error) {
      this.logger.error(`Update applicant failed for ${id}`, error.stack);
      if (error instanceof NotFoundException || error instanceof ConflictException) throw error;
      if (error.code === 11000) throw new ConflictException('Email already in use');
      throw new InternalServerErrorException('Failed to update applicant');
    }
  }

  async delete(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const applicant = await this.applicantRepository.findById(id);
      if (!applicant) {
        throw new NotFoundException(`Applicant with ID ${id} not found`);
      }

      // Soft delete - set isActive to false
      await this.applicantRepository.update(id, { isActive: false });
      return {
        success: true,
        message: 'Applicant deleted successfully',
      };
    } catch (error) {
      this.logger.error(`Delete applicant failed for ${id}`, error.stack);
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Failed to delete applicant');
    }
  }

  async activateEmail(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const applicant = await this.applicantRepository.findById(id);
      if (!applicant) {
        throw new NotFoundException(`Applicant with ID ${id} not found`);
      }

      const { rawToken, hashedToken } =
        generateEmailVerificationToken();

      const verificationUrl =
        `${process.env.FRONTEND_URL}/verify-email?token=${rawToken}`;

      await this.mailerService.sendEmailVerification(
        applicant.email,
        verificationUrl,
      );


      return {
        success: true,
        message: `Email successfully activated for ${id}`
      }
    } catch (error) {
      this.logger.error(`Cannot activate applicant email failed for ${id}`, error.stack);
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Failed to activate email');
    }
  }

  private toResponseDto(applicant: Applicant): ApplicantResponseDto {
    return {
      id: applicant._id.toString(),
      name: applicant.name,
      email: applicant.email,
      phone: applicant.phone,
      address: applicant.address,
      addressProvinceCode: applicant.addressProvinceCode,
      addressProvinceName: applicant.addressProvinceName,
      isActive: applicant.isActive,
      createdAt: applicant.createdAt,
      updatedAt: applicant.updatedAt,
    };
  }
}
